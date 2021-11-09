import React from 'react'
import ReactDOMFactories from 'react-dom-factories'
import { CFMGoogleDriveProviderOptions } from '../app-options'
import { CloudFileManagerClient } from '../client'
import { createReactClassFactory } from '../create-react-factory'
import tr  from '../utils/translate'
import {
  cloudContentFactory, CloudMetadata, ProviderCloseCallback, ProviderInterface,
  ProviderListCallback, ProviderLoadCallback, ProviderRemoveCallback, ProviderSaveCallback
}  from './provider-interface'

enum ELoadState {
  notLoaded = "not-loaded",
  loaded = "loaded",
  errored = "errored"
}

const {div, button, span} = ReactDOMFactories
const GoogleDriveAuthorizationDialog = createReactClassFactory({
  displayName: 'GoogleDriveAuthorizationDialog',

  getInitialState() {
    return {gapiLoadState: this.props.provider.gapiLoadState}
  },

  // See comments in AuthorizeMixin for detailed description of the issues here.
  // The short version is that we need to maintain synchronized instance variable
  // and state to track authorization status while avoiding calling setState on
  // unmounted components, which doesn't work and triggers a React warning.

  UNSAFE_componentWillMount() {
    return this.props.provider._waitForGAPILoad().then(() => {
      if (this._isMounted) {
        return this.setState({gapiLoadState: this.props.provider.gapiLoadState})
      }
    })
  },

  componentDidMount() {
    this._isMounted = true
    this.setState({gapiLoadState: this.props.provider.gapiLoadState})
  },

  componentWillUnmount() {
    return this._isMounted = false
  },

  authenticate() {
    // we rely on the fact that the prior call to authorized has set the callback
    // we need here
    return this.props.provider.authorize(this.props.provider.authCallback)
  },

  render() {
    const messageMap: Record<ELoadState, React.ReactChild> = {
      [ELoadState.notLoaded]: tr("~GOOGLE_DRIVE.CONNECTING_MESSAGE"),
      [ELoadState.loaded]: button({onClick: this.authenticate}, (tr("~GOOGLE_DRIVE.LOGIN_BUTTON_LABEL"))),
      [ELoadState.errored]: tr("~GOOGLE_DRIVE.ERROR_CONNECTING_MESSAGE")
    }
    const contents = messageMap[this.state.gapiLoadState as ELoadState] || "An unknown error occurred!"
    return (div({className: 'google-drive-auth'},
      (div({className: 'google-drive-concord-logo'}, '')),
      (div({className: 'google-drive-footer'},
        contents
      ))
    ))
  }
})

declare global {
  // loaded dynamically in _waitForGAPILoad
  var gapi: any
}

class GoogleDriveProvider extends ProviderInterface {
  static Name = 'googleDrive'
  static hasValidOptions = (options: any) => (typeof options?.clientId === 'string') &&
                                              (typeof options?.apiKey === 'string')
  static IMMEDIATE = true
  static SHOW_POPUP = false
  static loadPromise: Promise<unknown> = null
  _autoRenewTimeout: number
  apiKey: string
  authCallback: (authorized: boolean) => void
  authToken: any
  client: CloudFileManagerClient
  clientId: string
  gapiLoadState: ELoadState
  mimeType: string
  options: CFMGoogleDriveProviderOptions
  readableMimetypes: string[]
  scopes: string
  user: any

  constructor(options: CFMGoogleDriveProviderOptions | undefined, client: CloudFileManagerClient) {
    super({
      name: GoogleDriveProvider.Name,
      displayName: options?.displayName || (tr('~PROVIDER.GOOGLE_DRIVE')),
      urlDisplayName: options?.urlDisplayName,
      capabilities: {
        save: true,
        resave: true,
        'export': true,
        load: true,
        list: true,
        remove: false,
        rename: true,
        close: true,
        setFolder: true
      }
    })
    this.options = options
    this.client = client
    this.authToken = null
    this.user = null
    this.apiKey = this.options.apiKey
    this.clientId = this.options.clientId
    if (!this.apiKey) {
      throw new Error((tr("~GOOGLE_DRIVE.ERROR_MISSING_APIKEY")))
    }
    if (!this.clientId) {
      throw new Error((tr("~GOOGLE_DRIVE.ERROR_MISSING_CLIENTID")))
    }
    this.scopes = (this.options.scopes || [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.install',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]).join(" ")
    this.mimeType = this.options.mimeType || "text/plain"
    this.readableMimetypes = this.options.readableMimetypes

    this.gapiLoadState = ELoadState.notLoaded
    this._waitForGAPILoad()
      .then(() => this.gapiLoadState = ELoadState.loaded)
      .catch(() => this.gapiLoadState = ELoadState.errored)  // eslint-disable-line @typescript-eslint/dot-notation
  }

  /**
   * Invokes the provided callback with whether there is an authenticated user.
   * If authCallback is not defined, return the best result that can be had
   * synchronously.
   */
  authorized(authCallback: ((authorized: boolean) => void)) {
    if (!(authCallback == null)) { this.authCallback = authCallback }
    if (this.gapiLoadState === ELoadState.loaded && !authCallback) {
      return gapi.auth2.getAuthInstance().isSignedIn.get();
    }
    if (authCallback) {
      if (this.authToken) {
        return authCallback(true)
      } else {
        return this.doAuthorize(GoogleDriveProvider.IMMEDIATE)
      }
    } else {
      return this.authToken !== null
    }
  }

  doAuthorize(immediate: boolean) {
    return this._waitForGAPILoad().then(() => {
      const auth = gapi.auth2.getAuthInstance()
      const finishAuthorization = () => {
        const authorized = auth.isSignedIn.get()
        const currentUser = authorized ? auth.currentUser.get() : null
        this.authToken = currentUser ? currentUser.getAuthResponse(true) : null
        this.user = currentUser ? {name: currentUser.getBasicProfile().getName()} : null
        this.autoRenewToken(this.authToken)
        if (typeof this.authCallback === 'function') {
          this.authCallback(authorized)
        }
      }

      if (auth.isSignedIn.get()) {
        finishAuthorization()
      } else {
        if (!immediate) {
          auth.isSignedIn.listen((isAuth: boolean) => {
            if (isAuth) {
              finishAuthorization()
            }
            auth.isSignedIn.listen(() => {});
          })
          auth.signIn()
        } else {
          finishAuthorization()
        }
      }
    })
  }

  authorize(callback:any) {
    this.authCallback = callback;
    this.doAuthorize(!GoogleDriveProvider.IMMEDIATE);
  }

  autoRenewToken(authToken: any) {
    if (this._autoRenewTimeout) {
      clearTimeout(this._autoRenewTimeout)
    }
    if (authToken && !authToken.error) {
      return this._autoRenewTimeout = window.setTimeout((() => this.authorize(GoogleDriveProvider.IMMEDIATE)), (parseInt(authToken.expires_in, 10) * 0.75) * 1000)
    }
  }

  renderAuthorizationDialog() {
    return (GoogleDriveAuthorizationDialog({provider: this}))
  }

  renderUser() {
    if (this.user) {
      return (span({className: 'gdrive-user'}, (span({className: 'gdrive-icon'})), this.user.name))
    } else {
      return null
    }
  }

  save(content: any, metadata: CloudMetadata, callback: ProviderSaveCallback) {
    return this._waitForGAPILoad().then(() => {
      return this._saveFile(content, metadata, callback)
    })
  }

  load(metadata: CloudMetadata, callback: ProviderLoadCallback) {
    return this._waitForGAPILoad().then(() => {
      return this._loadFile(metadata, callback)
    })
  }

  list(metadata: CloudMetadata, callback: ProviderListCallback) {
    this.authorized((isAuthorized) => {
      if (isAuthorized) {
        const mimeTypesQuery = (this.readableMimetypes || []).map((mimeType: any) => `mimeType = '${mimeType}'`).join(" or ")
        const request = gapi.client.drive.files.list({
          fields: "files(id, mimeType, name, capabilities(canEdit))",
          q: `trashed = false and (${mimeTypesQuery} or mimeType = 'application/vnd.google-apps.folder') and '${metadata?.providerData.id || 'root'}' in parents`
        })
        return request.execute((result: any) => {
          if (!result || result.error) {
            return callback(this._apiError(result, 'Unable to list files'))
          }
          const list = []
          const files = result.files
          if (files?.length > 0) {
            for (let i = 0; i < files.length; i++) {
              const item = files[i]
              const type = item.mimeType === 'application/vnd.google-apps.folder' ? CloudMetadata.Folder : CloudMetadata.File
              if ((type === CloudMetadata.Folder) || this.matchesExtension(item.name)) {
                list.push(new CloudMetadata({
                      name: item.name,
                      type,
                      parent: metadata,
                      overwritable: item.capabilities.canEdit,
                      provider: this,
                      providerData: {
                        id: item.id
                      }
                    })
                )
              }
            }
          }
          list.sort((a, b) => {
            const lowerA = a.name.toLowerCase()
            const lowerB = b.name.toLowerCase()
            if (lowerA < lowerB) {
              return -1
            }
            if (lowerA > lowerB) {
              return 1
            }
            return 0
          })
          return callback(null, list)
        })
      }
      else {
        return callback(null, [])
      }
    })
  }

  remove(metadata: CloudMetadata, callback?: ProviderRemoveCallback) {
    return this._waitForGAPILoad().then(() => {
      const request = gapi.client.drive.files["delete"]({
        fileId: metadata.providerData.id})
      return request.execute((result: any) => callback?.(result?.error))
    })
  }

  rename(metadata: CloudMetadata, newName: string, callback?: (err: string | null, metadata?: CloudMetadata) => void) {
    return this._waitForGAPILoad().then(() => {
      const request = gapi.client.drive.files.patch({
        fileId: metadata.providerData.id,
        resource: {
          title: CloudMetadata.withExtension(newName)
        }
      })
      return request.execute((result: any) => {
        if (result != null ? result.error : undefined) {
          return callback?.(result.error)
        } else {
          metadata.rename(newName)
          return callback?.(null, metadata)
        }
      })
    })
  }

  close(metadata: CloudMetadata, callback: ProviderCloseCallback) {
    console.log('Closing GD File');
  }
    // nothing to do now that the realtime library was removed

  canOpenSaved() { return true }

  openSaved(openSavedParams: any, callback: ProviderLoadCallback) {
    const metadata = new CloudMetadata({
      type: CloudMetadata.File,
      provider: this,
      providerData: {
        id: openSavedParams
      }
    })
    return this.load(metadata, (err: string | null, content: any) => callback(err, content, metadata))
  }

  getOpenSavedParams(metadata: CloudMetadata) {
    return metadata.providerData.id
  }

  isAuthorizationRequired() {
    return true
  }

  _waitForGAPILoad() {
    return GoogleDriveProvider.loadPromise || (GoogleDriveProvider.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = "https://apis.google.com/js/api.js"
      script.onload = () => {
        gapi.load("client:auth2", () => {
          gapi.client.init({
            apiKey: this.apiKey,
            clientId: this.clientId,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            scope: this.scopes
          })
          .then(resolve)
          .catch(reject)  // eslint-disable-line @typescript-eslint/dot-notation
        })
      }
      document.head.appendChild(script)
    }))
  }

  _loadFile(metadata: CloudMetadata, callback: ProviderLoadCallback) {
    const request = gapi.client.drive.files.get({
      fileId: metadata.providerData.id,
      fields: "id, mimeType, name, parents, capabilities(canEdit)",
    })
    return request.execute((file: any) => {
      metadata.rename(file.name)
      metadata.overwritable = file.capabilities.canEdit
      metadata.providerData = {id: file.id}
      metadata.mimeType = file.mimeType
      if ((metadata.parent == null) && file.parents?.length) {
        metadata.parent = new CloudMetadata({
          type: CloudMetadata.Folder,
          provider: this,
          providerData: {
            id: file.parents[0]
          }
        })
      }

      // v3 of the api removed the downloadUrl from the returned file data so we need to manually construct it
      const xhr = new XMLHttpRequest()
      xhr.open('GET', `https://www.googleapis.com/drive/v3/files/${metadata.providerData.id}?alt=media`)
      xhr.setRequestHeader("Authorization", `Bearer ${this.authToken.access_token}`)
      xhr.onload = () => callback(null, cloudContentFactory.createEnvelopedCloudContent(xhr.responseText))
      xhr.onerror = () => callback("Unable to download file content")
      return xhr.send()
    })
  }

  _saveFile(content: any, metadata: CloudMetadata, callback: ProviderSaveCallback) {
    const boundary = '-------314159265358979323846'
    const mimeType = metadata.mimeType || this.mimeType
    const header = JSON.stringify({
      title: metadata.filename,
      mimeType,
      parents: [{id: (__guard__(metadata.parent != null ? metadata.parent.providerData : undefined, (x: any) => x.id) != null) ? metadata.parent.providerData.id : 'root'}]})

    const [method, path] = Array.from((metadata.providerData != null ? metadata.providerData.id : undefined) ?
      ['PUT', `/upload/drive/v2/files/${metadata.providerData.id}`]
    :
      ['POST', '/upload/drive/v2/files'])

    let transferEncoding = ""
    if (mimeType.indexOf("image/") === 0) {
      // assume we're transfering any images as base64
      transferEncoding = "\r\nContent-Transfer-Encoding: base64"
    }

    const body = [
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${header}`,
      `\r\n--${boundary}\r\nContent-Type: ${mimeType}${transferEncoding}\r\n\r\n${(typeof content.getContentAsJSON === 'function' ? content.getContentAsJSON() : undefined) || content}`,
      `\r\n--${boundary}--`
    ].join('')

    const request = gapi.client.request({
      path,
      method,
      params: {uploadType: 'multipart'},
      headers: {'Content-Type': `multipart/related; boundary="${boundary}"`},
      body
    })

    return request.execute((file: any) => {
      if (callback) {
        if (file != null ? file.error : undefined) {
          return callback(tr("~GOOGLE_DRIVE.UNABLE_TO_UPLOAD_MSG", {message: file.error.message}), file.error.code)
        } else if (file) {
          metadata.providerData = {id: file.id}
          return callback(null, file)
        } else {
          return callback(this._apiError(file, tr("~GOOGLE_DRIVE.UNABLE_TO_UPLOAD")))
        }
      }
    })
  }

  _apiError(result: any, prefix: string) {
    if (result?.message) {
      return `${prefix}: ${result.message}`
    } else {
      return prefix
    }
  }
}

export default GoogleDriveProvider

function __guard__(value: any, transform: any) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
