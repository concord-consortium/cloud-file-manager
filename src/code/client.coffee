tr = require './utils/translate'
isString = require './utils/is-string'
base64Array = require 'base64-js' # https://github.com/beatgammit/base64-js
getQueryParam = require './utils/get-query-param'

CloudFileManagerUI = (require './ui').CloudFileManagerUI

LocalStorageProvider = require './providers/localstorage-provider'
ReadOnlyProvider = require './providers/readonly-provider'
GoogleDriveProvider = require './providers/google-drive-provider'
LaraProvider = require './providers/lara-provider'
DocumentStoreProvider = require './providers/document-store-provider'
DocumentStoreShareProvider = require './providers/document-store-share-provider'
LocalFileProvider = require './providers/local-file-provider'
PostMessageProvider = require './providers/post-message-provider'
URLProvider = require './providers/url-provider'

ProviderInterface = (require './providers/provider-interface').ProviderInterface
cloudContentFactory = (require './providers/provider-interface').cloudContentFactory
CloudContent = (require './providers/provider-interface').CloudContent
CloudMetadata = (require './providers/provider-interface').CloudMetadata

class CloudFileManagerClientEvent

  @id: 0
  @events: {}

  constructor: (@type, @data = {}, @callback = null, @state = {}) ->
    CloudFileManagerClientEvent.id++
    @id = CloudFileManagerClientEvent.id

  postMessage: (iframe) ->
    if @callback
      CloudFileManagerClientEvent.events[@id] = @
    # remove client from data to avoid structured clone error in postMessage
    eventData = _.clone @data
    delete eventData.client
    message = {type: "cfm::event", eventId: @id, eventType: @type, eventData: eventData}
    iframe.postMessage message, "*"

class CloudFileManagerClient

  constructor: (options) ->
    @state =
      availableProviders: []
    @_listeners = []
    @_resetState()
    @_ui = new CloudFileManagerUI @
    @providers = {}
    @urlProvider = new URLProvider()

  setAppOptions: (@appOptions = {})->

    @appOptions.wrapFileContent ?= true
    CloudContent.wrapFileContent = @appOptions.wrapFileContent

    # Determine the available providers. Note that order in the list can
    # be significant in provider searches (e.g. @autoProvider).
    allProviders = {}
    providerList = [
      LocalStorageProvider
      ReadOnlyProvider
      GoogleDriveProvider
      LaraProvider
      DocumentStoreProvider
      LocalFileProvider
      PostMessageProvider
    ]
    for Provider in providerList
      if Provider.Available()
        allProviders[Provider.Name] = Provider

    # default to all providers if non specified
    if not @appOptions.providers
      @appOptions.providers = []
      for own providerName of allProviders
        appOptions.providers.push providerName

    # preset the extension if Available
    CloudMetadata.Extension = @appOptions.extension
    CloudMetadata.ReadableExtensions = @appOptions.readableExtensions or []
    if CloudMetadata.Extension then CloudMetadata.ReadableExtensions.push CloudMetadata.Extension

    readableMimetypes = @appOptions.readableMimeTypes or []
    readableMimetypes.push @appOptions.mimeType

    # check the providers
    requestedProviders = @appOptions.providers.slice()
    if getQueryParam "saveSecondaryFileViaPostMessage"
      requestedProviders.push 'postMessage'
    availableProviders = []
    shareProvider = null
    for providerSpec in requestedProviders
      [providerName, providerOptions] = if isString providerSpec \
                                          then [providerSpec, {}] \
                                          else [providerSpec.name, providerSpec]
      # merge in other options as needed
      providerOptions.mimeType ?= @appOptions.mimeType
      providerOptions.readableMimetypes = readableMimetypes
      if not providerName
        @alert "Invalid provider spec - must either be string or object with name property"
      else
        if providerSpec.createProvider
          allProviders[providerName] = providerSpec.createProvider ProviderInterface
        if allProviders[providerName]
          Provider = allProviders[providerName]
          provider = new Provider providerOptions, @
          @providers[providerName] = provider
          # if we're using the DocumentStoreProvider, instantiate the ShareProvider
          if providerName is DocumentStoreProvider.Name
            shareProvider = new DocumentStoreShareProvider(@, provider)
          if provider.urlDisplayName        # also add to here in providers list so we can look it up when parsing url hash
            @providers[provider.urlDisplayName] = provider
          availableProviders.push provider
        else
          @alert "Unknown provider: #{providerName}"
    @_setState
      availableProviders: availableProviders
      shareProvider: shareProvider

    @appOptions.ui or= {}

    @_ui.init @appOptions.ui

    # check for autosave
    if @appOptions.autoSaveInterval
      @autoSave @appOptions.autoSaveInterval

    # initialize the cloudContentFactory with all data we want in the envelope
    cloudContentFactory.setEnvelopeMetadata
      cfmVersion: '__PACKAGE_VERSION__' # replaced by version number at build time
      appName: @appOptions.appName or ""
      appVersion: @appOptions.appVersion or ""
      appBuildNum: @appOptions.appBuildNum or ""

    @newFileOpensInNewTab = if @appOptions.ui?.hasOwnProperty('newFileOpensInNewTab') then @appOptions.ui.newFileOpensInNewTab else true
    @newFileAddsNewToQuery = @appOptions.ui?.newFileAddsNewToQuery

    @_startPostMessageListener()

  setProviderOptions: (name, newOptions) ->
    for provider in @state.availableProviders
      if provider.name is name
        provider.options ?= {}
        for key of newOptions
          provider.options[key] = newOptions[key]
        break

  connect: ->
    @_event 'connected', {client: @}

  #
  # Called from CloudFileManager.clientConnect to process the URL parameters
  # and initiate opening any document specified by URL parameters. The CFM
  # hash params are processed here after which providers are given a chance
  # to process any provider-specific URL parameters. Calls ready() if no
  # initial document opening occurs.
  #
  processUrlParams: ->
    # process the hash params
    hashParams = @appOptions.hashParams
    if hashParams.sharedContentId
      @openSharedContent hashParams.sharedContentId
    else if hashParams.fileParams
      if hashParams.fileParams.indexOf("http") is 0
        @openUrlFile hashParams.fileParams
      else
        [providerName, providerParams] = hashParams.fileParams.split ':'
        @openProviderFile providerName, providerParams
    else if hashParams.copyParams
      @openCopiedFile hashParams.copyParams
    else if hashParams.newInFolderParams
      [providerName, folder] = hashParams.newInFolderParams.split ':'
      @createNewInFolder providerName, folder
    else
      # give providers a chance to process url params
      for provider in @state.availableProviders
        return if provider.handleUrlParams()

      # if no providers handled it, then just signal ready()
      @ready()

  ready: ->
    @_event 'ready'

  rendered: ->
    @_event 'rendered', {client: @}

  listen: (listener) ->
    if listener
      @_listeners.push listener

  log: (event, eventData) ->
    if (@appOptions.log)
      @appOptions.log event, eventData

  autoProvider: (capability) ->
    for provider in @state.availableProviders
      return provider if provider.canAuto capability

  appendMenuItem: (item) ->
    @_ui.appendMenuItem item; @

  prependMenuItem: (item) ->
    @_ui.prependMenuItem item; @

  replaceMenuItem: (key, item) ->
    @_ui.replaceMenuItem key, item; @

  insertMenuItemBefore: (key, item) ->
    @_ui.insertMenuItemBefore key, item; @

  insertMenuItemAfter: (key, item) ->
    @_ui.insertMenuItemAfter key, item; @

  setMenuBarInfo: (info) ->
    @_ui.setMenuBarInfo info

  newFile: (callback = null) ->
    @_closeCurrentFile()
    @_resetState()
    window.location.hash = ""
    @_event 'newedFile', {content: ""}

  newFileDialog: (callback = null) ->
    if @newFileOpensInNewTab
      window.open @getCurrentUrl(if @newFileAddsNewToQuery then "#new" else null), '_blank'
    else if @state.dirty
      if @_autoSaveInterval and @state.metadata
        @save()
        @newFile()
      else
        @confirm tr('~CONFIRM.NEW_FILE'), => @newFile()
    else
      @newFile()

  openFile: (metadata, callback = null) ->
    if metadata?.provider?.can 'load', metadata
      @_event 'willOpenFile', {op: "openFile"}
      metadata.provider.load metadata, (err, content) =>
        return @alert(err, => @ready()) if err
        # should wait to close current file until client signals open is complete
        @_closeCurrentFile()
        @_fileOpened content, metadata, {openedContent: content.clone()}, @_getHashParams metadata
        callback? content, metadata
        metadata.provider.fileOpened content, metadata
    else
      @openFileDialog callback

  openFileDialog: (callback = null) ->
    showDialog = =>
      @_ui.openFileDialog (metadata) =>
        @openFile metadata, callback
    if not @state.dirty
      showDialog()
    else
      @confirm tr('~CONFIRM.OPEN_FILE'), showDialog

  closeFile: (callback = null) ->
    @_closeCurrentFile()
    @_resetState()
    window.location.hash = ""
    @_event 'closedFile', {content: ""}
    callback?()

  closeFileDialog: (callback = null) ->
    if not @state.dirty
      @closeFile callback
    else
      @confirm tr('~CONFIRM.CLOSE_FILE'), => @closeFile callback

  importData: (data, callback = null) ->
    @_event 'importedData', data
    callback? data

  importDataDialog: (callback = null) ->
    @_ui.importDataDialog (data) =>
      @importData data, callback

  readLocalFile: (file, callback=null) ->
    reader = new FileReader()
    reader.onload = (loaded) ->
      callback? {name: file.name, content: loaded.target.result}
    reader.readAsText file

  openLocalFile: (file, callback=null) ->
    @_event 'willOpenFile', {op: "openLocalFile"}
    @readLocalFile file, (data) =>
      content = cloudContentFactory.createEnvelopedCloudContent data.content
      metadata = new CloudMetadata
        name: data.name
        type: CloudMetadata.File
      @_fileOpened content, metadata, {openedContent: content.clone()}
      callback? content, metadata

  importLocalFile: (file, callback=null) ->
    @readLocalFile file, (data) =>
      @importData data, callback

  openSharedContent: (id) ->
    @_event 'willOpenFile', {op: "openSharedContent"}
    @state.shareProvider?.loadSharedContent id, (err, content, metadata) =>
      return @alert(err, => @ready()) if err
      @_fileOpened content, metadata, {overwritable: false, openedContent: content.clone()}

  # must be called as a result of user action (e.g. click) to avoid popup blockers
  parseUrlAuthorizeAndOpen: ->
    if @appOptions.hashParams?.fileParams?
      [providerName, providerParams] = @appOptions.hashParams.fileParams.split ':'
      provider = @providers[providerName]
      if provider
        provider.authorize =>
          @openProviderFile providerName providerParams

  confirmAuthorizeAndOpen: (provider, providerParams) ->
    # trigger authorize() from confirmation dialog to avoid popup blockers
    @confirm tr("~CONFIRM.AUTHORIZE_OPEN"), =>
      provider.authorize =>
        @_event 'willOpenFile', {op: "confirmAuthorizeAndOpen"}
        provider.openSaved providerParams, (err, content, metadata) =>
          return @alert(err) if err
          @_fileOpened content, metadata, {openedContent: content.clone()}, @_getHashParams metadata
          provider.fileOpened content, metadata

  openProviderFile: (providerName, providerParams) ->
    provider = @providers[providerName]
    if provider
      provider.authorized (authorized) =>
        # we can open the document without authorization in some cases
        if authorized or not provider.isAuthorizationRequired()
          @_event 'willOpenFile', {op: "openProviderFile"}
          provider.openSaved providerParams, (err, content, metadata) =>
            return @alert(err, => @ready()) if err
            @_fileOpened content, metadata, {openedContent: content.clone()}, @_getHashParams metadata
            provider.fileOpened content, metadata
        else
          @confirmAuthorizeAndOpen(provider, providerParams)
    else
      @alert tr("~ALERT.NO_PROVIDER"), => @ready()

  openUrlFile: (url) ->
    @urlProvider.openFileFromUrl url, (err, content, metadata) =>
      @_event 'willOpenFile', {op: "openUrlFile"}
      return @alert(err, => @ready()) if err
      @_fileOpened content, metadata, {openedContent: content.clone()}, @_getHashParams metadata

  createNewInFolder: (providerName, folder) ->
    provider = @providers[providerName]
    if provider and provider.can 'setFolder', @state.metadata
      if not @state.metadata?
        @state.metadata = new CloudMetadata
          type: CloudMetadata.File
          provider: provider

      @state.metadata.parent = new CloudMetadata
        type: CloudMetadata.Folder
        providerData:
          id: folder

      @_ui.editInitialFilename()
    @_event 'newedFile', {content: ""}

  setInitialFilename: (filename) ->
    @state.metadata.rename filename
    @save()

  isSaveInProgress: ->
    @state.saving?

  confirmAuthorizeAndSave: (stringContent, callback) ->
    # trigger authorize() from confirmation dialog to avoid popup blockers
    @confirm tr("~CONFIRM.AUTHORIZE_SAVE"), =>
      @state.metadata.provider.authorize =>
        @saveFile stringContent, @state.metadata, callback

  save: (callback = null) ->
    @_event 'getContent', { shared: @_sharedMetadata() }, (stringContent) =>
      @saveContent stringContent, callback

  saveContent: (stringContent, callback = null) ->
    provider = @state.metadata?.provider or @autoProvider 'save'
    if provider?
      provider.authorized (isAuthorized) =>
        # we can save the document without authorization in some cases
        if isAuthorized or not provider.isAuthorizationRequired()
          @saveFile stringContent, @state.metadata, callback
        else
          @confirmAuthorizeAndSave stringContent, callback
    else
      @saveFileDialog stringContent, callback

  saveFile: (stringContent, metadata, callback = null) ->
    # must be able to 'resave' to save silently, i.e. without save dialog
    if metadata?.provider?.can('resave', metadata)
      @saveFileNoDialog stringContent, metadata, callback
    else
      @saveFileDialog stringContent, callback

  saveFileNoDialog: (stringContent, metadata, callback = null) ->
    @_setState
      saving: metadata
    currentContent = @_createOrUpdateCurrentContent stringContent, metadata
    metadata.provider.save currentContent, metadata, (err, statusCode) =>
      if err
        # disable autosave on save failure; clear "Saving..." message
#        metadata.autoSaveDisabled = true
        @_setState { metadata: metadata, saving: null }
        if statusCode is 403
          return @confirmAuthorizeAndSave stringContent, callback
        else
          failures = @state.failures
          if (not failures)
            failures = 1
          else
            failures++
          @_setState { failures: failures }
          return @alert(err) if failures is 1
      else
        @_setState { failures: 0 }
        if @state.metadata isnt metadata
          @_closeCurrentFile()
        # reenable autosave on save success if this isn't a local file save
        delete metadata.autoSaveDisabled if metadata.autoSaveDisabled?
        @_fileChanged 'savedFile', currentContent, metadata, {saved: true}, @_getHashParams metadata
        callback? currentContent, metadata

  saveFileDialog: (stringContent = null, callback = null) ->
    @_ui.saveFileDialog (metadata) =>
      @_dialogSave stringContent, metadata, callback

  saveFileAsDialog: (stringContent = null, callback = null) ->
    @_ui.saveFileAsDialog (metadata) =>
      @_dialogSave stringContent, metadata, callback

  createCopy: (stringContent = null, callback = null) ->
    saveAndOpenCopy = (stringContent) =>
      @saveCopiedFile stringContent, @state.metadata?.name, (err, copyParams) =>
        return callback? err if err
        window.open @getCurrentUrl "#copy=#{copyParams}"
        callback? copyParams
    if stringContent is null
      @_event 'getContent', {}, (stringContent) ->
        saveAndOpenCopy stringContent
    else
      saveAndOpenCopy stringContent

  saveCopiedFile: (stringContent, name, callback) ->
    try
      prefix = 'cfm-copy::'
      maxCopyNumber = 0
      for own key of window.localStorage
        if key.substr(0, prefix.length) is prefix
          copyNumber = parseInt(key.substr(prefix.length), 10)
          maxCopyNumber = Math.max(maxCopyNumber, copyNumber)
      maxCopyNumber++
      value = JSON.stringify
        name: if name?.length > 0 then "Copy of #{name}" else "Copy of Untitled Document"
        stringContent: stringContent
      window.localStorage.setItem "#{prefix}#{maxCopyNumber}", value
      callback? null, maxCopyNumber
    catch e
      callback "Unable to temporarily save copied file"

  openCopiedFile: (copyParams) ->
    @_event 'willOpenFile', {op: "openCopiedFile"}
    try
      key = "cfm-copy::#{copyParams}"
      copied = JSON.parse window.localStorage.getItem key
      content = cloudContentFactory.createEnvelopedCloudContent copied.stringContent
      metadata = new CloudMetadata
        name: copied.name
        type: CloudMetadata.File
      window.location.hash = ""
      @_fileOpened content, metadata, {dirty: true, openedContent: content.clone()}
      window.localStorage.removeItem key
    catch e
      callback "Unable to load copied file"

  _sharedMetadata: ->
    @state.currentContent?.getSharedMetadata() or {}

  shareGetLink: ->
    @_ui.shareDialog @

  shareUpdate: ->
    @share => @alert (tr "~SHARE_UPDATE.MESSAGE"), (tr "~SHARE_UPDATE.TITLE")

  toggleShare: (callback) ->
    if @isShared()
      @unshare callback
    else
      @share callback

  isShared: ->
    @state.currentContent?.get("sharedDocumentId") and not @state.currentContent?.get("isUnshared")

  canEditShared: ->
    accessKeys = @state.currentContent?.get("accessKeys") or {}
    shareEditKey = @state.currentContent?.get("shareEditKey")
    (shareEditKey or accessKeys.readWrite) and not @state.currentContent?.get("isUnshared")

  setShareState: (shared, callback) ->
    if @state.shareProvider
      sharingMetadata = @state.shareProvider.getSharingMetadata shared
      @_event 'getContent', { shared: sharingMetadata }, (stringContent) =>
        @_setState
          sharing: shared
        sharedContent = cloudContentFactory.createEnvelopedCloudContent stringContent
        sharedContent.addMetadata sharingMetadata
        currentContent = @_createOrUpdateCurrentContent stringContent, @state.metadata
        sharedContent.set('docName', currentContent.get('docName'))
        if shared
          currentContent.remove 'isUnshared'
        else
          currentContent.set 'isUnshared', true
        @state.shareProvider.share shared, currentContent, sharedContent, @state.metadata, (err, sharedContentId) =>
          return @alert(err) if err
          callback? null, sharedContentId, currentContent

  share: (callback) ->
    @setShareState true, (err, sharedContentId, currentContent) =>
      @_fileChanged 'sharedFile', currentContent, @state.metadata
      callback? null, sharedContentId

  unshare: (callback) ->
    @setShareState false, (err, sharedContentId, currentContent) =>
      @_fileChanged 'unsharedFile', currentContent, @state.metadata
      callback? null

  revertToShared: (callback = null) ->
    id = @state.currentContent?.get("sharedDocumentId")
    if id and @state.shareProvider?
      @state.shareProvider.loadSharedContent id, (err, content, metadata) =>
        return @alert(err) if err
        @state.currentContent.copyMetadataTo content
        if not metadata.name and docName = content.get('docName')
          metadata.name = docName
        @_fileOpened content, metadata, {dirty: true, openedContent: content.clone()}
        callback? null

  revertToSharedDialog: (callback = null) ->
    if @state.currentContent?.get("sharedDocumentId") and @state.shareProvider?
      @confirm tr("~CONFIRM.REVERT_TO_SHARED_VIEW"), => @revertToShared callback

  downloadDialog: (callback = null) ->
    # should share metadata be included in downloaded local files?
    @_event 'getContent', { shared: @_sharedMetadata() }, (content) =>
      envelopedContent = cloudContentFactory.createEnvelopedCloudContent content
      @state.currentContent?.copyMetadataTo envelopedContent
      @_ui.downloadDialog @state.metadata?.name, envelopedContent, callback

  getDownloadBlob: (content, includeShareInfo, mimeType='text/plain') ->
    if typeof content is "string"
      if mimeType.indexOf("image") >= 0
        contentToSave = base64Array.toByteArray(content)
      else
        contentToSave = content

    else if includeShareInfo
      contentToSave = JSON.stringify(content.getContent())

    else # not includeShareInfo
      # clone the document so we can delete the share info and not affect the original
      json = content.clone().getContent()
      delete json.sharedDocumentId
      delete json.shareEditKey
      delete json.isUnshared
      delete json.accessKeys
      # CODAP moves the keys into its own namespace
      delete json.metadata.shared if json.metadata?.shared?
      contentToSave = JSON.stringify(json)

    new Blob([contentToSave], {type: mimeType})

  getDownloadUrl: (content, includeShareInfo, mimeType='text/plain') ->
    wURL = window.URL or window.webkitURL
    wURL.createObjectURL(@getDownloadBlob content, includeShareInfo, mimeType) if wURL

  rename: (metadata, newName, callback) ->
    dirty = @state.dirty
    _rename = (metadata) =>
      @state.currentContent?.addMetadata docName: metadata.name
      @_fileChanged 'renamedFile', @state.currentContent, metadata, {dirty: dirty}, @_getHashParams metadata
      callback? newName
    if newName isnt @state.metadata?.name
      if @state.metadata?.provider?.can 'rename', metadata
        @state.metadata.provider.rename @state.metadata, newName, (err, metadata) =>
          return @alert(err) if err
          _rename metadata
      else
        if metadata
          metadata.name = newName
          metadata.filename = newName
        else
          metadata = new CloudMetadata
            name: newName
            type: CloudMetadata.File
        _rename metadata

  renameDialog: (callback = null) ->
    @_ui.renameDialog @state.metadata?.name, (newName) =>
      @rename @state.metadata, newName, callback

  revertToLastOpened: (callback = null) ->
    @_event 'willOpenFile', {op: "revertToLastOpened"}
    if @state.openedContent? and @state.metadata
      @_fileOpened @state.openedContent, @state.metadata, {openedContent: @state.openedContent.clone()}

  revertToLastOpenedDialog: (callback = null) ->
    if @state.openedContent? and @state.metadata
      @confirm tr('~CONFIRM.REVERT_TO_LAST_OPENED'), => @revertToLastOpened callback
    else
      callback? 'No initial opened version was found for the currently active file'

  saveSecondaryFileAsDialog: (stringContent, extension, mimeType, callback) ->
    if (provider = @autoProvider 'export')
      metadata = { provider, extension, mimeType }
      @saveSecondaryFile stringContent, metadata, callback
    else
      data = { content: stringContent, extension, mimeType }
      @_ui.saveSecondaryFileAsDialog data, (metadata) =>
        # replace defaults
        if extension
          metadata.filename = CloudMetadata.newExtension metadata.filename, extension
        if mimeType
          metadata.mimeType = mimeType

        @saveSecondaryFile stringContent, metadata, callback

  # Saves a file to backend, but does not update current metadata.
  # Used e.g. when exporting .csv files from CODAP
  saveSecondaryFile: (stringContent, metadata, callback = null) ->
    if metadata?.provider?.can 'export', metadata
      metadata.provider.saveAsExport stringContent, metadata, (err, statusCode) =>
        if err
          return @alert(err)
        callback? stringContent, metadata

  dirty: (isDirty = true)->
    @_setState
      dirty: isDirty
      saved: @state.saved and not isDirty
    if window.self isnt window.top
      # post to parent and not top window (not a bug even though we test for self inst top above)
      window.parent.postMessage({type: "cfm::setDirty", isDirty: isDirty}, "*")

  shouldAutoSave: =>
    @state.dirty and
      not @state.metadata?.autoSaveDisabled and
      not @isSaveInProgress() and
      @state.metadata?.provider?.can 'resave', @state.metadata

  autoSave: (interval) ->
    if @_autoSaveInterval
      clearInterval @_autoSaveInterval

    # in case the caller uses milliseconds
    if interval > 1000
      interval = Math.round(interval / 1000)
    if interval > 0
      @_autoSaveInterval = setInterval (=> @save() if @shouldAutoSave()), (interval * 1000)

  isAutoSaving: ->
    @_autoSaveInterval?

  changeLanguage: (newLangCode, callback) ->
    if callback
      if not @state.dirty
        callback newLangCode
      else
        @confirm tr('~CONFIRM.CHANGE_LANGUAGE'), -> callback newLangCode

  showBlockingModal: (modalProps) ->
    @_ui.showBlockingModal modalProps

  hideBlockingModal: ->
    @_ui.hideBlockingModal()

  getCurrentUrl: (queryString = null) ->
    suffix = if queryString? then "?#{queryString}" else ""
    # Check browser support for document.location.origin (& window.location.origin)
    "#{document.location.origin}#{document.location.pathname}#{suffix}"

  # Takes an array of strings representing url parameters to be removed from the URL.
  # Removes the specified parameters from the URL and then uses the history API's
  # pushState() method to update the URL without reloading the page.
  # Adapted from http://stackoverflow.com/a/11654436.
  removeQueryParams: (params) ->
    url = window.location.href
    hash = url.split('#')

    for key in params
      re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "g")

      if re.test(url)
        hash[0] = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '')

    url = hash[0] + if hash[1]? then '#' + hash[1] else ''

    if url isnt window.location.href
      history.pushState { originalUrl: window.location.href }, '', url

  confirm: (message, callback) ->
    @confirmDialog { message: message, callback: callback }

  confirmDialog: (params) ->
    @_ui.confirmDialog params

  alert: (message, titleOrCallback, callback) ->
    if _.isFunction(titleOrCallback)
      callback = titleOrCallback
      titleOrCallback = null
    @_ui.alertDialog message, (titleOrCallback or tr "~CLIENT_ERROR.TITLE"), callback

  _dialogSave: (stringContent, metadata, callback) ->
    if stringContent isnt null
      @saveFileNoDialog stringContent, metadata, callback
    else
      @_event 'getContent', { shared: @_sharedMetadata() }, (stringContent) =>
        @saveFileNoDialog stringContent, metadata, callback

  _fileChanged: (type, content, metadata, additionalState={}, hashParams=null) ->
    metadata?.overwritable ?= true
    @_updateState content, metadata, additionalState, hashParams
    @_event type, { content: content?.getClientContent(), shared: @_sharedMetadata() }

  _fileOpened: (content, metadata, additionalState={}, hashParams=null) ->
    # @_event 'openedFile', { content: content?.getClientContent(), metadata: metadata }, (iError, iSharedMetadata) =>
    eventData = { content: content?.getClientContent() }
    # update state before sending 'openedFile' events so that 'openedFile' listeners that
    # reference state have the updated state values
    @_updateState content, metadata, additionalState, hashParams
    # add metadata contentType to event for CODAP to load via postmessage API (for SageModeler standalone)
    contentType = metadata.mimeType or metadata.contentType
    eventData.metadata = {contentType, url: metadata.url, filename: metadata.filename}
    @_event 'openedFile', eventData, (iError, iSharedMetadata) =>
      return @alert(iError, => @ready()) if iError

      metadata?.overwritable ?= true
      if not @appOptions.wrapFileContent
        content.addMetadata iSharedMetadata
      # and then update state again for the metadata and content changes
      @_updateState content, metadata, additionalState, hashParams
      @ready()

  _updateState: (content, metadata, additionalState={}, hashParams=null) ->
    state =
      currentContent: content
      metadata: metadata
      saving: null
      saved: false
      dirty: not additionalState.saved and content?.requiresConversion()
    for own key, value of additionalState
      state[key] = value
    if hashParams isnt null
      window.location.hash = hashParams
    @_setState state

  _event: (type, data = {}, eventCallback = null) ->
    event = new CloudFileManagerClientEvent type, data, eventCallback, @state
    for listener in @_listeners
      listener event
    # Workaround to fix https://www.pivotaltracker.com/story/show/162392580
    # CODAP will fail on the renamedFile message because we don't send the state with
    # the postMessage events and CODAP examines the state to get the new name.
    # I tried sending the state but that causes CODAP to replace its state which breaks other things.
    # A permanent fix for this would be to send the new filename outside of the state metadata.
    skipPostMessage = type is "renamedFile"
    if @appOptions?.sendPostMessageClientEvents and @iframe and not skipPostMessage
      event.postMessage(@iframe.contentWindow)

  _setState: (options) ->
    for own key, value of options
      @state[key] = value
    @_event 'stateChanged'

  _resetState: ->
    @_setState
      openedContent: null
      currentContent: null
      metadata: null
      dirty: false
      saving: null
      saved: false
      failures: null

  _closeCurrentFile: ->
    if @state.metadata?.provider?.can 'close', @state.metadata
      @state.metadata.provider.close @state.metadata

  _createOrUpdateCurrentContent: (stringContent, metadata = null) ->
    if @state.currentContent?
      currentContent = @state.currentContent
      currentContent.setText stringContent
    else
      currentContent = cloudContentFactory.createEnvelopedCloudContent stringContent
    if metadata?
      currentContent.addMetadata docName: metadata.name
    currentContent

  _getHashParams: (metadata) ->
    if metadata?.provider?.canOpenSaved() and (openSavedParams = metadata?.provider?.getOpenSavedParams metadata)?
      "#file=#{metadata.provider.urlDisplayName or metadata.provider.name}:#{encodeURIComponent openSavedParams}"
    else if metadata?.provider instanceof URLProvider and
        window.location.hash.indexOf("#file=http") is 0
      window.location.hash    # leave it alone
    else ""

  _startPostMessageListener: ->
    $(window).on 'message', (e) =>
      oe = e.originalEvent
      data = oe.data or {}
      reply = (type, params={}) ->
        message = _.merge {}, params, {type: type}
        oe.source.postMessage message, oe.origin
      switch oe.data?.type
        when 'cfm::getCommands'
          reply 'cfm::commands', commands: ['cfm::autosave', 'cfm::event', 'cfm::event:reply', 'cfm::setDirty', 'cfm::iframedClientConnected']
        when 'cfm::autosave'
          if @shouldAutoSave()
            @save -> reply 'cfm::autosaved', saved: true
          else
            reply 'cfm::autosaved', saved: false
        when 'cfm::event'
          @_event data.eventType, data.eventData, ->
            callbackArgs = JSON.stringify(Array.prototype.slice.call(arguments))
            reply 'cfm::event:reply', {eventId: data.eventId, callbackArgs: callbackArgs}
        when 'cfm::event:reply'
          event = CloudFileManagerClientEvent.events[data.eventId]
          event?.callback?.apply(@, JSON.parse(data.callbackArgs))
        when 'cfm::setDirty'
          @dirty data.isDirty
        when 'cfm::iframedClientConnected'
          @processUrlParams()


module.exports =
  CloudFileManagerClientEvent: CloudFileManagerClientEvent
  CloudFileManagerClient: CloudFileManagerClient
