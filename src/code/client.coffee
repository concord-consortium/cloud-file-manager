tr = require './utils/translate'
isString = require './utils/is-string'

CloudFileManagerUI = (require './ui').CloudFileManagerUI

LocalStorageProvider = require './providers/localstorage-provider'
ReadOnlyProvider = require './providers/readonly-provider'
GoogleDriveProvider = require './providers/google-drive-provider'
DocumentStoreProvider = require './providers/document-store-provider'

CloudContent = (require './providers/provider-interface').CloudContent

class CloudFileManagerClientEvent

  constructor: (@type, @data = {}, @callback = null, @state = {}) ->

class CloudFileManagerClient

  constructor: (options) ->
    @state =
      availableProviders: []
    @_listeners = []
    @_resetState()
    @_ui = new CloudFileManagerUI @

  setAppOptions: (@appOptions = {})->
    # flter for available providers
    allProviders = {}
    for Provider in [ReadOnlyProvider, LocalStorageProvider, GoogleDriveProvider, DocumentStoreProvider]
      if Provider.Available()
        allProviders[Provider.Name] = Provider

    # default to all providers if non specified
    if not @appOptions.providers
      @appOptions.providers = []
      for own providerName of allProviders
        appOptions.providers.push providerName

    # check the providers
    availableProviders = []
    for provider in @appOptions.providers
      [providerName, providerOptions] = if isString provider then [provider, {}] else [provider.name, provider]
      # merge in other options as needed
      providerOptions.mimeType ?= @appOptions.mimeType
      if not providerName
        @_error "Invalid provider spec - must either be string or object with name property"
      else
        if allProviders[providerName]
          Provider = allProviders[providerName]
          availableProviders.push new Provider providerOptions
        else
          @_error "Unknown provider: #{providerName}"
    @_setState availableProviders: availableProviders

    # add singleton shareProvider, if it exists
    for provider in @state.availableProviders
      if provider.can 'share'
        @_setState shareProvider: provider
        break

    @_ui.init @appOptions.ui

    # check for autosave
    if @appOptions.autoSaveInterval
      @autoSave @appOptions.autoSaveInterval

  setProviderOptions: (name, newOptions) ->
    for provider in @state.availableProviders
      if provider.name is name
        provider.options ?= {}
        for key of newOptions
          provider.options[key] = newOptions[key]
        break

  connect: ->
    @_event 'connected', {client: @}

  listen: (listener) ->
    if listener
      @_listeners.push listener

  appendMenuItem: (item) ->
    @_ui.appendMenuItem item
    @

  prependMenuItem: (item) ->
    @_ui.prependMenuItem item
    @

  replaceMenuItem: (key, item) ->
    @_ui.replaceMenuItem key, item
    @

  insertMenuItemBefore: (key, item) ->
    @_ui.insertMenuItemBefore key, item
    @

  insertMenuItemAfter: (key, item) ->
    @_ui.insertMenuItemAfter key, item
    @

  setMenuBarInfo: (info) ->
    @_ui.setMenuBarInfo info

  getEmptyContent: ->
    new CloudContent()

  createContent: (content) ->
    new CloudContent content
  createTextContent: (text) ->
    content = new CloudContent()
    content.initText text
    content
  createJSONContent: (json) ->
    content = new CloudContent()
    content.initJSON json
    content

  newFile: (callback = null) ->
    @_closeCurrentFile()
    @_resetState()
    @_event 'newedFile', {content: @getEmptyContent()}

  newFileDialog: (callback = null) ->
    if @appOptions.ui?.newFileOpensInNewTab
      window.open window.location, '_blank'
    else if @state.dirty
      if @_autoSaveInterval and @state.metadata
        @save()
        @newFile()
      else if confirm tr '~CONFIRM.NEW_FILE'
        @newFile()
    else
      @newFile()

  openFile: (metadata, callback = null) ->
    if metadata?.provider?.can 'load'
      metadata.provider.load metadata, (err, content) =>
        return @_error(err) if err
        @_closeCurrentFile()
        @_fileChanged 'openedFile', content, metadata
        callback? content, metadata
    else
      @openFileDialog callback

  openFileDialog: (callback = null) ->
    if (not @state.dirty) or (confirm tr '~CONFIRM.OPEN_FILE')
      @_ui.openFileDialog (metadata) =>
        @openFile metadata, callback

  openSharedContent: (id) ->
    @state.shareProvider?.loadSharedContent id, (err, content) =>
      return @_error(err) if err
      @_fileChanged 'openedFile', content, {overwritable: false}

  save: (callback = null) ->
    @_event 'getContent', {}, (content) =>
      @saveContent content, callback

  saveContent: (content, callback = null) ->
    if @state.metadata
      @saveFile content, @state.metadata, callback
    else
      @saveFileDialog content, callback

  saveFile: (content, metadata, callback = null) ->
    if metadata?.provider?.can 'save'
      @_setState
        saving: metadata
      metadata.provider.save content, metadata, (err) =>
        return @_error(err) if err
        if @state.metadata isnt metadata
          @_closeCurrentFile()
        @_fileChanged 'savedFile', content, metadata
        callback? content, metadata
    else
      @saveFileDialog content, callback

  saveFileDialog: (content = null, callback = null) ->
    @_ui.saveFileDialog (metadata) =>
      @_dialogSave content, metadata, callback

  saveFileAsDialog: (content = null, callback = null) ->
    @_ui.saveFileAsDialog (metadata) =>
      @_dialogSave content, metadata, callback

  saveCopyDialog: (content = null, callback = null) ->
    saveCopy = (content, metadata) =>
      metadata.provider.save content, metadata, (err) =>
        return @_error(err) if err
        callback? content, metadata
    @_ui.saveCopyDialog (metadata) =>
      if content is null
        @_event 'getContent', {}, (content) ->
          saveCopy content, metadata
      else
        saveCopy content, metadata

  share: ->
    if @state.shareProvider
      @_event 'getContent', {}, (content) =>
        @_setState
          saving: true
        @state.shareProvider.saveSharedContent content, (err, sharedContentId) =>
          @_setState
            saving: false
          return @_error(err) if err

          path = document.location.origin + document.location.pathname
          shareQuery = "?openShared=#{sharedContentId}"
          @_ui.shareUrlDialog "#{path}#{shareQuery}"

  downloadDialog: (callback = null) ->
    @_event 'getContent', {}, (content) =>
      @_ui.downloadDialog @state.metadata?.name, @appOptions.mimeType, content, callback

  rename: (metadata, newName, callback) ->
    if newName isnt @state.metadata.name
      @state.metadata.provider.rename @state.metadata, newName, (err, metadata) =>
        return @_error(err) if err
        @_setState
          metadata: metadata
        @_event 'renamedFile', {metadata: metadata}
        callback? newName

  renameDialog: (callback = null) ->
    if @state.metadata
      @_ui.renameDialog @state.metadata.name, (newName) =>
        @rename @state.metadata, newName, callback
    else
      callback? 'No currently active file'

  reopen: (callback = null) ->
    if @state.metadata
      @openFile @state.metadata, callback

  reopenDialog: (callback = null) ->
    if @state.metadata
      if (not @state.dirty) or (confirm tr '~CONFIRM.REOPEN_FILE')
        @openFile @state.metadata, callback
    else
      callback? 'No currently active file'

  dirty: (isDirty = true)->
    @_setState
      dirty: isDirty
      saved: false if isDirty

  autoSave: (interval) ->
    if @_autoSaveInterval
      clearInterval @_autoSaveInterval

    # in case the caller uses milliseconds
    if interval > 1000
      interval = Math.round(interval / 1000)
    if interval > 0
      @_autoSaveInterval = setInterval (=> @save() if @state.dirty and @state.metadata?.provider?.can 'save'), (interval * 1000)

  isAutoSaving: ->
    @_autoSaveInterval > 0

  _dialogSave: (content, metadata, callback) ->
    if content isnt null
      @saveFile content, metadata, callback
    else
      @_event 'getContent', {}, (content) =>
        @saveFile content, metadata, callback

  _error: (message) ->
    # for now an alert
    alert message

  _fileChanged: (type, content, metadata) ->
    metadata.overwritable ?= true
    @_setState
      content: content
      metadata: metadata
      saving: null
      saved: type is 'savedFile'
      dirty: false
    @_event type, {content: content, metadata: metadata}

  _event: (type, data = {}, eventCallback = null) ->
    event = new CloudFileManagerClientEvent type, data, eventCallback, @state
    for listener in @_listeners
      listener event

  _setState: (options) ->
    for own key, value of options
      @state[key] = value
    @_event 'stateChanged'

  _resetState: ->
    @_setState
      content: null
      metadata: null
      dirty: false
      saving: null
      saved: false

  _closeCurrentFile: ->
    if @state.metadata?.provider?.can 'close'
      @state.metadata.provider.close @state.metadata

module.exports =
  CloudFileManagerClientEvent: CloudFileManagerClientEvent
  CloudFileManagerClient: CloudFileManagerClient
