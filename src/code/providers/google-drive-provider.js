{div, button, span} = ReactDOMFactories

tr = require '../utils/translate'
isString = require '../utils/is-string'
jsdiff = require 'diff'

ProviderInterface = (require './provider-interface').ProviderInterface
cloudContentFactory = (require './provider-interface').cloudContentFactory
CloudMetadata = (require './provider-interface').CloudMetadata

GoogleDriveAuthorizationDialog = createReactClassFactory
  displayName: 'GoogleDriveAuthorizationDialog'

  getInitialState: ->
    loadedGAPI: window._LoadedGAPIClients

  # See comments in AuthorizeMixin for detailed description of the issues here.
  # The short version is that we need to maintain synchronized instance variable
  # and state to track authorization status while avoiding calling setState on
  # unmounted components, which doesn't work and triggers a React warning.

  UNSAFE_componentWillMount: ->
    @props.provider._loadedGAPI =>
      if @_isMounted
        @setState loadedGAPI: true

  componentDidMount: ->
    @_isMounted = true
    if @state.loadedGAPI isnt window._LoadedGAPIClients
      @setState loadedGAPI: window._LoadedGAPIClients

  componentWillUnmount: ->
    @_isMounted = false

  authenticate: ->
    @props.provider.authorize GoogleDriveProvider.SHOW_POPUP

  render: ->
    (div {className: 'google-drive-auth'},
      (div {className: 'google-drive-concord-logo'}, '')
      (div {className: 'google-drive-footer'},
        if window._LoadedGAPIClients or @state.loadedGAPI
          (button {onClick: @authenticate}, (tr "~GOOGLE_DRIVE.LOGIN_BUTTON_LABEL"))
        else
          (tr "~GOOGLE_DRIVE.CONNECTING_MESSAGE")
      )
    )

class GoogleDriveProvider extends ProviderInterface

  constructor: (@options = {}, @client) ->
    super
      name: GoogleDriveProvider.Name
      displayName: @options.displayName or (tr '~PROVIDER.GOOGLE_DRIVE')
      urlDisplayName: @options.urlDisplayName
      capabilities:
        save: true
        resave: true
        export: true
        load: true
        list: true
        remove: false
        rename: true
        close: true
        setFolder: true

    @authToken = null
    @user = null
    @clientId = @options.clientId
    if not @clientId
      throw new Error (tr "~GOOGLE_DRIVE.ERROR_MISSING_CLIENTID")
    @scopes = @options.scopes or [
      'https://www.googleapis.com/auth/drive'
      'https://www.googleapis.com/auth/drive.install'
      'https://www.googleapis.com/auth/drive.file'
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
    @mimeType = @options.mimeType or "text/plain"
    @readableMimetypes = @options.readableMimetypes
    @_loadGAPI()

  @Name: 'googleDrive'

  # aliases for boolean parameter to authorize
  @IMMEDIATE = true
  @SHOW_POPUP = false

  authorized: (authCallback) ->
    @authCallback = authCallback unless not authCallback?
    if authCallback
      if @authToken
        authCallback true
      else
        @authorize GoogleDriveProvider.IMMEDIATE
    else
      @authToken isnt null

  authorize: (immediate) ->
    @_loadedGAPI =>
      args =
        client_id: @clientId
        scope: @scopes
        immediate: immediate
      gapi.auth.authorize args, (authToken) =>
        @authToken = if authToken and not authToken.error then authToken else null
        @user = null
        @autoRenewToken @authToken
        if @authToken
          gapi.client.oauth2.userinfo.get().execute (user) =>
            @user = user
        @authCallback? @authToken isnt null

  autoRenewToken: (authToken) ->
    if @_autoRenewTimeout
      clearTimeout @_autoRenewTimeout
    if authToken and not authToken.error
      @_autoRenewTimeout = setTimeout (=> @authorize GoogleDriveProvider.IMMEDIATE), (parseInt(authToken.expires_in, 10) * 0.75) * 1000

  renderAuthorizationDialog: ->
    (GoogleDriveAuthorizationDialog {provider: @})

  renderUser: ->
    if @user
      (span {className: 'gdrive-user'}, (span {className: 'gdrive-icon'}), @user.name)
    else
      null

  save:  (content, metadata, callback) ->
    @_loadedGAPI =>
      @_saveFile content, metadata, callback

  load: (metadata, callback) ->
    @_loadedGAPI =>
      @_loadFile metadata, callback

  list: (metadata, callback) ->
    @_loadedGAPI =>
      mimeTypesQuery = ("mimeType = '#{mimeType}'" for mimeType in @readableMimetypes).join " or "
      request = gapi.client.drive.files.list
        q: query = "trashed = false and (#{mimeTypesQuery} or mimeType = 'application/vnd.google-apps.folder') and '#{if metadata then metadata.providerData.id else 'root'}' in parents"
      request.execute (result) =>
        return callback(@_apiError(result, 'Unable to list files')) if not result or result.error
        list = []
        for item in result?.items
          type = if item.mimeType is 'application/vnd.google-apps.folder' then CloudMetadata.Folder else CloudMetadata.File
          if type is CloudMetadata.Folder or @matchesExtension item.title
            list.push new CloudMetadata
              name: item.title
              type: type
              parent: metadata
              overwritable: item.editable
              provider: @
              providerData:
                id: item.id
        list.sort (a, b) ->
          lowerA = a.name.toLowerCase()
          lowerB = b.name.toLowerCase()
          return -1 if lowerA < lowerB
          return 1 if lowerA > lowerB
          return 0
        callback null, list

  remove: (metadata, callback) ->
    @_loadedGAPI ->
      request = gapi.client.drive.files.delete
        fileId: metadata.providerData.id
      request.execute (result) ->
        callback? result?.error or null

  rename: (metadata, newName, callback) ->
    @_loadedGAPI ->
      request = gapi.client.drive.files.patch
        fileId: metadata.providerData.id
        resource:
          title: CloudMetadata.withExtension newName
      request.execute (result) ->
        if result?.error
          callback? result.error
        else
          metadata.rename newName
          callback null, metadata

  close: (metadata, callback) ->
    # nothing to do now that the realtime library was removed

  canOpenSaved: -> true

  openSaved: (openSavedParams, callback) ->
    metadata = new CloudMetadata
      type: CloudMetadata.File
      provider: @
      providerData:
        id: openSavedParams
    @load metadata, (err, content) ->
      callback err, content, metadata

  getOpenSavedParams: (metadata) ->
    metadata.providerData.id

  isAuthorizationRequired: ->
    true

  _loadGAPI: ->
    if not window._LoadingGAPI
      window._LoadingGAPI = true
      window._GAPIOnLoad = =>
        window._LoadedGAPI = true
        # preload clients to avoid user delay later
        @_loadedGAPI ->
      script = document.createElement 'script'
      script.src = 'https://apis.google.com/js/client.js?onload=_GAPIOnLoad'
      document.head.appendChild script

  _loadedGAPI: (callback) ->
    if window._LoadedGAPIClients
      callback()
    else
      self = @
      check = ->
        if window._LoadedGAPI
          gapi.client.load 'drive', 'v2', ->
            gapi.client.load 'oauth2', 'v2', ->
              window._LoadedGAPIClients = true
              callback.call self
        else
          setTimeout check, 10
      setTimeout check, 10

  _loadFile: (metadata, callback) ->
    request = gapi.client.drive.files.get
      fileId: metadata.providerData.id
    request.execute (file) =>
      if file?.downloadUrl
        metadata.rename file.title
        metadata.overwritable = file.editable
        metadata.providerData = id: file.id
        metadata.mimeType = file.mimeType
        if not metadata.parent? and file.parents?.length > 0
          metadata.parent = new CloudMetadata
            type: CloudMetadata.Folder
            provider: @
            providerData:
              id: file.parents[0].id
        download = (url, fallback) =>
          xhr = new XMLHttpRequest()
          xhr.open 'GET', url
          xhr.setRequestHeader("Authorization", "Bearer #{@authToken.access_token}")
          xhr.onload = ->
            callback null, cloudContentFactory.createEnvelopedCloudContent xhr.responseText
          xhr.onerror = ->
            # try second request after changing the domain (https://issuetracker.google.com/issues/149891169)
            if fallback
              download(url.replace(/^https:\/\/content\.googleapis\.com/, "https://www.googleapis.com"), false)
            else
              callback "Unable to download file content"
          xhr.send()
        download(file.downloadUrl, true)
      else
        callback @_apiError file, 'Unable to get download url'

  _saveFile: (content, metadata, callback) ->
    boundary = '-------314159265358979323846'
    mimeType = metadata.mimeType or @mimeType
    header = JSON.stringify
      title: metadata.filename
      mimeType: mimeType
      parents: [{id: if metadata.parent?.providerData?.id? then metadata.parent.providerData.id else 'root'}]

    [method, path] = if metadata.providerData?.id
      ['PUT', "/upload/drive/v2/files/#{metadata.providerData.id}"]
    else
      ['POST', '/upload/drive/v2/files']

    transferEncoding = ""
    if mimeType.indexOf("image/") is 0
      # assume we're transfering any images as base64
      transferEncoding = "\r\nContent-Transfer-Encoding: base64"

    body = [
      "\r\n--#{boundary}\r\nContent-Type: application/json\r\n\r\n#{header}",
      "\r\n--#{boundary}\r\nContent-Type: #{mimeType}#{transferEncoding}\r\n\r\n#{content.getContentAsJSON?() or content}",
      "\r\n--#{boundary}--"
    ].join ''

    request = gapi.client.request
      path: path
      method: method
      params: {uploadType: 'multipart'}
      headers: {'Content-Type': 'multipart/related; boundary="' + boundary + '"'}
      body: body

    request.execute (file) =>
      if callback
        if file?.error
          callback "Unabled to upload file: #{file.error.message}"
        else if file
          metadata.providerData = id: file.id
          callback null, file
        else
          callback @_apiError file, 'Unabled to upload file'

  _apiError: (result, prefix) ->
    if result?.message?
      "#{prefix}: #{result.message}"
    else
      prefix

module.exports = GoogleDriveProvider