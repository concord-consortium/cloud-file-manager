import $ from 'jquery'
import _ from 'lodash'
import { ReactFactory } from '../create-react-factory'
import ReactDOMFactories from 'react-dom-factories'
import { createReactClassFactory } from '../create-react-factory'
const {div, button, span} = ReactDOMFactories

import getQueryParam  from '../utils/get-query-param'
import getHashParam  from '../utils/get-hash-param'
import tr  from '../utils/translate'
import pako  from 'pako'

import { CFMDocumentStoreProviderOptions } from '../app-options'
import { ECapabilities, ProviderInterface, ProviderListCallback, ProviderOpenCallback }  from './provider-interface'
import { cloudContentFactory }  from './provider-interface'
import { CloudMetadata }  from './provider-interface'

import { CloudFileManagerClient } from '../client'
import DocumentStoreUrl  from './document-store-url'
import PatchableContent  from './patchable-content'
import { reportError } from '../utils/report-error'

const DocumentStoreAuthorizationDialog = createReactClassFactory({
  displayName: 'DocumentStoreAuthorizationDialog',

  getInitialState() {
    return {docStoreAvailable: false}
  },

  UNSAFE_componentWillMount() {
    this.props.provider._onDocStoreLoaded(() => {
      this.setState({docStoreAvailable: true})
    })
  },

  authenticate() {
    this.props.provider.authorize()
  },

  render() {
    return (div({className: 'document-store-auth'},
      (div({className: 'document-store-concord-logo'}, '')),
      (div({className: 'document-store-footer'},
        this.state.docStoreAvailable ?
          (button({onClick: this.authenticate}, 'Login to Concord'))
        :
          'Trying to log into Concord...'
      ))
    ))
  }
})

class DocumentStoreProvider extends ProviderInterface {
  static Name = 'documentStore'
  _docStoreLoaded!: boolean
  _loginWindow: Window | null = null
  authCallback!: (authorized: boolean) => void
  client: CloudFileManagerClient
  disableForNextSave?: boolean
  docStoreLoadedCallback!: () => void
  docStoreUrl: DocumentStoreUrl
  options: CFMDocumentStoreProviderOptions
  removableQueryParams: string[]
  savedContent: any
  urlParams: Record<string, string | null>
  user: any

  static get deprecationPhase() {
    return 3
  }

  static isNotDeprecated(capability: ECapabilities) {
    if (capability === 'save') {
      return DocumentStoreProvider.deprecationPhase < 2
    } else {
      return DocumentStoreProvider.deprecationPhase < 3
    }
  }
  constructor(options: CFMDocumentStoreProviderOptions, client: CloudFileManagerClient) {
    super({
      name: DocumentStoreProvider.Name,
      displayName: options?.displayName || (tr('~PROVIDER.DOCUMENT_STORE')),
      urlDisplayName: options?.urlDisplayName,
      capabilities: {
        save: DocumentStoreProvider.isNotDeprecated(ECapabilities.save),
        resave: DocumentStoreProvider.isNotDeprecated(ECapabilities.save),
        "export": false,
        load: DocumentStoreProvider.isNotDeprecated(ECapabilities.load),
        list: DocumentStoreProvider.isNotDeprecated(ECapabilities.list),
        remove: DocumentStoreProvider.isNotDeprecated(ECapabilities.remove),
        rename: DocumentStoreProvider.isNotDeprecated(ECapabilities.rename),
        close: false
      }
    })

    this.options = options
    this.client = client
    this.urlParams = {
      documentServer: getQueryParam("documentServer"),
      recordid: getQueryParam("recordid"),
      runKey: getQueryParam("runKey"),
      docName: getQueryParam("doc"),
      docOwner: getQueryParam("owner")
    }
    // query params that can be removed after initial processing
    this.removableQueryParams = ['recordid', 'doc', 'owner']

    this.docStoreUrl = new DocumentStoreUrl(this.urlParams.documentServer)

    this.user = null

    this.savedContent = new PatchableContent(this.options.patchObjectHash)
  }

  can(capability: ECapabilities, metadata: CloudMetadata) {
    // legacy sharing support - can't save to old-style shared documents
    if (((capability === 'save') || (capability === 'resave')) && metadata?.providerData?.owner) { return false }
    return super.can(capability, metadata)
  }

  // if a runKey is specified, we don't need to authenticate at all
  isAuthorizationRequired() {
    return !(this.urlParams.runKey || (this.urlParams.docName && this.urlParams.docOwner))
  }

  authorized(authCallback: (authorized: boolean) => void) {
    this.authCallback = authCallback
    if (this.authCallback) {
      if (this.user) {
        return this.authCallback(true)
      } else {
        return this._checkLogin()
      }
    } else {
      return this.user !== null
    }
  }

  authorize(completionCallback: () => void) {
    return this._showLoginWindow(completionCallback)
  }

  _onDocStoreLoaded(docStoreLoadedCallback: () => void) {
    this.docStoreLoadedCallback = docStoreLoadedCallback
    if (this._docStoreLoaded) {
      return this.docStoreLoadedCallback()
    }
  }

  _checkLogin() {
    const loggedIn = (user: any) => {
      this.user = user
      this._docStoreLoaded = true
      if (typeof this.docStoreLoadedCallback === 'function') {
        this.docStoreLoadedCallback()
      }
      if (user) {
        if (this._loginWindow != null) {
          this._loginWindow.close()
        }
      }
      if (this.authCallback) { return this.authCallback((user != null)) }
    }

    $.ajax({
      dataType: 'json',
      url: this.docStoreUrl.checkLogin(),
      xhrFields: {
        withCredentials: true
      },
      success(data) { loggedIn(data) },
      error() { loggedIn(null) }
    })
  }

  _showLoginWindow(completionCallback: () => void) {
    if (this._loginWindow && !this._loginWindow.closed) {
      this._loginWindow.focus()
    } else {

      const computeScreenLocation = function(w: number, h: number) {
        const screenLeft = window.screenLeft || (screen as any).left
        const screenTop  = window.screenTop  || (screen as any).top
        const width  = window.innerWidth  || document.documentElement.clientWidth  || screen.width
        const height = window.innerHeight || document.documentElement.clientHeight || screen.height

        const left = ((width / 2) - (w / 2)) + screenLeft
        const top = ((height / 2) - (h / 2)) + screenTop
        return {left, top}
      }

      const width = 1000
      const height = 480
      const position = computeScreenLocation(width, height)
      const windowFeatures = [
        `width=${width}`,
        `height=${height}`,
        (`top=${position.top}`) || 200,
        (`left=${position.left}`) || 200,
        'dependent=yes',
        'resizable=no',
        'location=no',
        'dialog=yes',
        'menubar=no'
      ]

      this._loginWindow = window.open(this.docStoreUrl.authorize(), 'auth', windowFeatures.join())

      if (this._loginWindow) {
        const loginWindow = this._loginWindow
        const pollAction = () => {
          try {
            if (loginWindow.location.host === window.location.host) {
              clearInterval(poll)
              loginWindow.close()
              this._checkLogin()
              if (completionCallback) { return completionCallback() }
            }
          } catch (e) {
            reportError(e instanceof Error ? e : String(e))
          }
        }
        var poll = setInterval(pollAction, 200)
      }
    }

    return this._loginWindow
  }

  renderAuthorizationDialog() {
    return (DocumentStoreAuthorizationDialog({provider: this, authCallback: this.authCallback}))
  }

  renderUser() {
    if (this.user) {
      return (span({}, (span({className: 'document-store-icon'})), this.user.name))
    } else {
      return null
    }
  }

  filterTabComponent(capability: ECapabilities, defaultComponent: ReactFactory): ReactFactory | null {
    // allow the save elsewhere button to hide the document provider tab in save
    if ((capability === 'save') && this.disableForNextSave) {
      this.disableForNextSave = false
      return null
    } else {
      return defaultComponent
    }
  }



  deprecationMessage() {
    return `\
<div style="text-align: left">
  <p style="margin: 10px 0;">
    <strong>
      tr('~CONCORD_CLOUD_DEPRECATION.SHUT_DOWN_MESSAGE')}
    </strong>
  </p>
  <p style="margin: 10px 0;">
    tr('~CONCORD_CLOUD_DEPRECATION.PLEASE_SAVE_ELSEWHERE')}
  </p>
</div>\
`
  }

  onProviderTabSelected(capability: ECapabilities) {
    if ((capability === 'save') && this.deprecationMessage()) {
      this.client.alert(this.deprecationMessage(), (tr('~CONCORD_CLOUD_DEPRECATION.ALERT_SAVE_TITLE')))
    }
  }

  handleUrlParams() {
    if (this.urlParams.recordid) {
      this.client.openProviderFile(this.name, { id: this.urlParams.recordid })
      return true // signal that the provider is handling the params
    } else if (this.urlParams.docName && this.urlParams.docOwner) {
      this.client.openProviderFile(this.name, { name: this.urlParams.docName, owner: this.urlParams.docOwner })
      return true // signal that the provider is handling the params
    } else {
      return false
    }
  }

  list(metadata: CloudMetadata, callback?: ProviderListCallback) {
    $.ajax({
      dataType: 'json',
      url: this.docStoreUrl.listDocuments(),
      context: this,
      xhrFields: {
        withCredentials: true
      },
      success(data) {
        const list = []
        for (const key of Object.keys(data || {})) {
          const file = data[key]
          if (this.matchesExtension(file.name)) {
            list.push(new CloudMetadata({
              name: file.name,
              providerData: {id: file.id},
              type: CloudMetadata.File,
              provider: this
            })
            )
          }
        }
        callback?.(null, list)
      },
      error() {
        callback?.(null, [])
      },
      statusCode: {
        403: () => {
          this.user = null
          this.authCallback(false)
        }
      }
    })
  }

  load(metadata: CloudMetadata, callback: (err: string | null, data?: any) => void) {
    const withCredentials = !metadata.sharedContentId
    const recordid = metadata.providerData?.id || metadata.sharedContentId
    const requestData: { recordid?: string, runKey?: string, recordname?: string, owner?: string } = {}
    if (recordid) { requestData.recordid = recordid }
    if (this.urlParams.runKey) { requestData.runKey = this.urlParams.runKey }
    if (!recordid) {
      if (metadata.providerData?.name) { requestData.recordname = metadata.providerData.name }
      if (metadata.providerData?.owner) { requestData.owner = metadata.providerData.owner }
    }
    $.ajax({
      url: this.docStoreUrl.loadDocument(),
      dataType: 'json',
      data: requestData,
      context: this,
      xhrFields:
        {withCredentials},
      success(data) {
        const content = cloudContentFactory.createEnvelopedCloudContent(data)

        // for documents loaded by id or other means (besides name),
        // capture the name for use in the CFM interface.
        // 'docName' at the top level for CFM-wrapped documents
        // 'name' at the top level for unwrapped documents (e.g. CODAP)
        // 'name' at the top level of 'content' for wrapped CODAP documents
        metadata.rename(metadata.name || metadata.providerData.name ||
                        data.docName || data.name || data.content?.name)
        if (metadata.name) {
          content.addMetadata({docName: metadata.filename ?? undefined})
        }

        callback(null, content)
      },
      statusCode: {
        403: () => {
          this.user = null
          callback(tr("~DOCSTORE.LOAD_403_ERROR", {filename: metadata.name || 'the file'}), 403)
        }
      },

      error(jqXHR) {
        if (jqXHR.status === 403) { return } // let statusCode handler deal with it
        const message = metadata.sharedContentId
          ? tr("~DOCSTORE.LOAD_SHARED_404_ERROR")
          : tr("~DOCSTORE.LOAD_404_ERROR", {filename: metadata.name || metadata.providerData?.id || 'the file'})
        callback(message)
      }
    })
  }

  save(cloudContent: any, metadata: CloudMetadata, callback: (err: string | null, data?: any) => void) {
    const content = cloudContent.getContent()

    // See if we can patch
    const patchResults = this.savedContent.createPatch(content, this.options.patch && metadata.overwritable)

    if (patchResults.shouldPatch && !patchResults.diffLength) {
      // no reason to patch if there are no diffs
      callback(null) // no error indicates success
      return
    }

    const params = {}
    if (metadata.providerData.id) { (params as any).recordid = metadata.providerData.id }

    if (!patchResults.shouldPatch && metadata.filename) {
      (params as any).recordname = metadata.filename
    }

    // If we are saving for the first time as a student in a LARA activity, then we do not have
    // authorization on the current document. However, we should have a runKey query parameter.
    // When we save with this runKey, the document will save our changes to a copy of the document,
    // owned by us.
    //
    // When we successfully save, we will get the id of the new document in the response, and use
    // this id for future saving. We can then save via patches, and don't need the runKey.
    if (this.urlParams.runKey) {
      (params as any).runKey = this.urlParams.runKey
    }

    const method = 'POST'
    const url = patchResults.shouldPatch
            ? this.docStoreUrl.patchDocument(params)
            : this.docStoreUrl.saveDocument(params)

    const logData = {
      operation: 'save',
      provider: 'DocumentStoreProvider',
      shouldPatch: patchResults.shouldPatch,
      method,
      url,
      params: JSON.stringify(params),
      content: patchResults.sendContent.substr(0, 512)
    }
    this.client.log('save', logData)

    $.ajax({
      dataType: 'json',
      type: method,
      url,
      data: pako.deflate(patchResults.sendContent),
      contentType: patchResults.mimeType,
      processData: false,
      beforeSend(xhr) {
        xhr.setRequestHeader('Content-Encoding', 'deflate')
      },
      context: this,
      xhrFields: {
        withCredentials: true
      },
      success(data) {
        this.savedContent.updateContent(this.options.patch ? _.cloneDeep(content) : null)
        if (data.id) { metadata.providerData.id = data.id }

        callback(null, data)
      },
      statusCode: {
        403: () => {
          this.user = null
          callback(tr("~DOCSTORE.SAVE_403_ERROR", {filename: metadata.name ?? 'the file'}), 403)
        }
      },
      error(jqXHR) {
        try {
          if (jqXHR.status === 403) { return } // let statusCode handler deal with it
          const responseJson = JSON.parse(jqXHR.responseText)
          if (responseJson.message === 'error.duplicate') {
            callback(tr("~DOCSTORE.SAVE_DUPLICATE_ERROR", {filename: metadata.name ?? 'the file'}))
          } else {
            callback(tr("~DOCSTORE.SAVE_ERROR_WITH_MESSAGE", {filename: metadata.name ?? 'the file', message: responseJson.message}))
          }
        } catch (error) {
          callback(tr("~DOCSTORE.SAVE_ERROR", {filename: metadata.name ?? 'the file'}))
        }
      }})
  }

  remove(metadata: CloudMetadata, callback: (err: string | null, data?: any) => void) {
    $.ajax({
      url: this.docStoreUrl.deleteDocument(),
      data: {
        recordname: metadata.filename
      },
      context: this,
      xhrFields: {
        withCredentials: true
      },
      success(data) {
        callback(null, data)
      },
      statusCode: {
        403: () => {
          this.user = null
          callback(tr("~DOCSTORE.REMOVE_403_ERROR", {filename: metadata.name ?? 'the file'}), 403)
        }
      },
      error(jqXHR) {
        if (jqXHR.status === 403) { return } // let statusCode handler deal with it
        callback(tr("~DOCSTORE.REMOVE_ERROR", {filename: metadata.name ?? 'the file'}))
      }})
  }

  rename(metadata: CloudMetadata, newName: string, callback: (err: string | null, data?: any) => void) {
    $.ajax({
      url: this.docStoreUrl.renameDocument(),
      data: {
        recordid: metadata.providerData.id,
        newRecordname: CloudMetadata.withExtension(newName)
      },
      context: this,
      xhrFields: {
        withCredentials: true
      },
      success(data) {
        metadata.rename(newName)
        callback(null, metadata)
      },
      statusCode: {
        403: () => {
          this.user = null
          callback(tr("~DOCSTORE.RENAME_403_ERROR", {filename: metadata.name ?? 'the file'}), 403)
        }
      },
      error(jqXHR) {
        if (jqXHR.status === 403) { return } // let statusCode handler deal with it
        callback(tr("~DOCSTORE.RENAME_ERROR", {filename: metadata.name ?? 'the file'}))
      }})
  }

  canOpenSaved() { return true }

  openSaved(openSavedParams: any, callback: ProviderOpenCallback) {
    const providerData = typeof openSavedParams === "object"
                      ? openSavedParams
                      : { id: openSavedParams }
    const metadata = new CloudMetadata({
      type: CloudMetadata.File,
      provider: this,
      providerData
    })

    this.load(metadata, (err: string | null, content: any) => {
      this.client.removeQueryParams(this.removableQueryParams)
      callback(err, content, metadata)
    })
  }

  getOpenSavedParams(metadata: CloudMetadata) {
    return metadata.providerData.id
  }

  fileOpened(content: any, metadata: CloudMetadata) {
    const deprecationPhase = this.options.deprecationPhase || 0
    const fromLara = !!getQueryParam("launchFromLara") || !!getHashParam("lara")
    if (!deprecationPhase || fromLara) { return }
    this.client.confirmDialog({
      title: tr('~CONCORD_CLOUD_DEPRECATION.CONFIRM_SAVE_TITLE'),
      message: this.deprecationMessage(),
      yesTitle: tr('~CONCORD_CLOUD_DEPRECATION.CONFIRM_SAVE_ELSEWHERE'),
      noTitle: tr('~CONCORD_CLOUD_DEPRECATION.CONFIRM_DO_IT_LATER'),
      hideNoButton: deprecationPhase >= 3,
      callback: () => {
        this.disableForNextSave = true
        this.client.saveFileAsDialog(content)
      },
      rejectCallback: () => {
        if (deprecationPhase > 1) {
          this.client.appOptions.autoSaveInterval = undefined
        }
      }
    })
  }
}

export default DocumentStoreProvider
