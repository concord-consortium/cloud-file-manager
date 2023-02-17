import React from 'react'
import ReactDOMFactories from 'react-dom-factories'
import { CFMGoogleDriveProviderOptions } from '../app-options'
import { CloudFileManagerClient } from '../client'
import { createReactClassFactory } from '../create-react-factory'
import tr  from '../utils/translate'
import {
  AuthorizedOptions,
  cloudContentFactory, CloudMetadata, ECapabilities, IListOptions, ProviderCloseCallback, ProviderInterface,
  ProviderListCallback, ProviderLoadCallback, ProviderRemoveCallback, ProviderSaveCallback
}  from './provider-interface'

enum ELoadState {
  notLoaded = "not-loaded",
  loaded = "loaded",
  errored = "errored",
  missingScopes = "missing-scopes"
}

enum EDriveType {
  none = "none",
  myDrive = "my-drive",
  sharedWithMe = "shared-with-me",
  sharedDrives = "shared-drives"
}

const OpenSavedParamDelimiter = ";"

type OnAuthorizationChangeCallback = (authorized: boolean) => void

let setGoogleDriveAuthorizationDialogState: undefined | ((newState: any) => void) = undefined

const {div, button, span, strong} = ReactDOMFactories
const GoogleDriveAuthorizationDialog = createReactClassFactory({
  displayName: 'GoogleDriveAuthorizationDialog',

  getInitialState() {
    return {apiLoadState: this.props.provider.apiLoadState}
  },

  // See comments in AuthorizeMixin for detailed description of the issues here.
  // The short version is that we need to maintain synchronized instance variable
  // and state to track authorization status while avoiding calling setState on
  // unmounted components, which doesn't work and triggers a React warning.

  UNSAFE_componentWillMount() {
    return this.props.provider.waitForAPILoad().then(() => {
      if (this._isMounted) {
        return this.setState({apiLoadState: this.props.provider.apiLoadState})
      }
    })
  },

  componentDidMount() {
    this._isMounted = true
    this.setState({apiLoadState: this.props.provider.apiLoadState})
    setGoogleDriveAuthorizationDialogState = (newState: any) => {
      this.setState(newState)
    }
  },

  componentWillUnmount() {
    // setGoogleDriveAuthorizationDialogState = undefined
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
      [ELoadState.errored]: tr("~GOOGLE_DRIVE.ERROR_CONNECTING_MESSAGE"),
      [ELoadState.missingScopes]: div({className: 'google-drive-missing-scopes'},
        div({}, tr("~GOOGLE_DRIVE.MISSING_SCOPES_MESSAGE")),
        div({}, button({onClick: this.authenticate}, (tr("~GOOGLE_DRIVE.LOGIN_BUTTON_LABEL"))))
      ),
    }
    const contents = messageMap[this.state.apiLoadState as ELoadState] || "An unknown error occurred!"
    return (div({className: 'google-drive-auth'},
      (div({className: 'google-drive-concord-logo'}, '')),
      (div({className: 'google-drive-footer'},
        contents
      ))
    ))
  }
})

declare global {
  // loaded dynamically in waitForGAPILoad
  var gapi: any
  // loaded dynamically in waitForGISLoad
  var google: any
}

class GoogleDriveProvider extends ProviderInterface {
  static Name = 'googleDrive'
  static hasValidOptions = (options: any) => (typeof options?.clientId === 'string') &&
                                              (typeof options?.apiKey === 'string')
  static IMMEDIATE = true
  static SHOW_POPUP = false
  static gisLoadPromise: Promise<unknown> = null
  static gapiLoadPromise: Promise<unknown> = null
  static apiLoadPromise: Promise<unknown> = null
  _autoRenewTimeout: number
  apiKey: string
  authCallback: (authorized: boolean) => void
  authToken: any
  tokenClient: any
  client: CloudFileManagerClient
  clientId: string
  apiLoadState: ELoadState
  mimeType: string
  options: CFMGoogleDriveProviderOptions
  readableMimetypes: string[]
  scopes: string
  user: any
  onAuthorizationChangeCallback: OnAuthorizationChangeCallback|undefined
  promptForConsent: boolean

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

    this.apiLoadState = ELoadState.notLoaded
    this.waitForAPILoad()
      .then(() => this.apiLoadState = ELoadState.loaded)
      .catch(() => this.apiLoadState = ELoadState.errored)  // eslint-disable-line @typescript-eslint/dot-notation
  }

  /**
   * Invokes the provided callback with whether there is an authenticated user.
   * If authCallback is not defined, return the best result that can be had
   * synchronously.
   */
  authorized(authCallback: ((authorized: boolean) => void), options?: AuthorizedOptions) {
    if (!(authCallback == null)) { this.authCallback = authCallback }
    if (this.apiLoadState === ELoadState.loaded && !authCallback) {
      return gapi.client.getToken() !== null
    }
    if (authCallback) {
      if (this.authToken) {
        return authCallback(true)
      } else {
        if (options?.forceAuthorization) {
          return this.client.confirmDialog({
            className: 'login-to-google-confirm-dialog',
            title: tr('~PROVIDER.GOOGLE_DRIVE'),
            yesTitle: tr('~GOOGLE_DRIVE.LOGIN_BUTTON_LABEL'),
            hideNoButton: true,
            hideTitleText: true,
            callback: () => {
              return this.doAuthorize(GoogleDriveProvider.SHOW_POPUP)
            }
          })
        } else {
          return this.doAuthorize(GoogleDriveProvider.IMMEDIATE)
        }
      }
    } else {
      return this.authToken !== null
    }
  }

  doAuthorize(immediate: boolean) {
    return this.waitForAPILoad().then(() => {

      this.tokenClient.callback = (tokenResponse: any) => {
        if (tokenResponse?.error) {
          // TODO: show error (future story #183842099)
          return
        }

        const params = [tokenResponse, ...this.scopes.split(" ")]
        const hasGrantedAllScopes = google.accounts.oauth2.hasGrantedAllScopes.apply(null, params)
        if (hasGrantedAllScopes) {
          gapi.client.oauth2.userinfo.get().then(({result}: any) => {
            this.user = result
            this.authToken = tokenResponse
            if (typeof this.authCallback === 'function') {
              this.authCallback(true)
            }
          })
        } else {
          setGoogleDriveAuthorizationDialogState?.({apiLoadState: ELoadState.missingScopes})
        }
      }

      if (!immediate) {
        this.tokenClient.requestAccessToken({prompt: this.promptForConsent ? 'consent' : ''})
      }
    })
  }

  authorize(callback:any) {
    this.authCallback = callback
    // Calling doAuthorize with immediate set to false permits an authorization
    // dialog, if necessary
    this.doAuthorize(!GoogleDriveProvider.IMMEDIATE)
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
    return this.waitForAPILoad().then(() => {
      return this.saveFile(content, metadata, callback)
    })
  }

  load(metadata: CloudMetadata, callback: ProviderLoadCallback) {
    return this.waitForAPILoad().then(() => {
      return this.loadFile(metadata, callback)
    })
  }

  can(capability: ECapabilities, metadata?: CloudMetadata) {
    // disable autosave for readonly files
    if (capability === ECapabilities.resave && metadata && !metadata.overwritable) {
      return false
    }
    return super.can(capability, metadata)
  }

  getAllFilesOrDrives(metadata: CloudMetadata, callback: (err: any, files: any[]) => void, options?: IListOptions) {
    let filesOrDrives: any[] = []
    let listParams: any = {}
    const listDrives = metadata.providerData.driveType === EDriveType.sharedDrives && !metadata.providerData.driveId
    const listApiMethod = listDrives ? gapi.client.drive.drives.list : gapi.client.drive.files.list

    const extension = options?.extension
    const readableExtensions = extension ? [extension] : CloudMetadata.ReadableExtensions

    if (listDrives) {
      listParams = {
        pageSize: 100, // 100 is max on drive list operations
      }
    } else {
      const queryParts = ["trashed = false"]
      // when an extension is passed show all files matching the extension, otherwise filter on mimeType
      // this is needed as you can't filter on non-Google mimetypes like text/csv or image/png
      if (!extension) {

        // add the direct mimetypes
        const mimeTypes: string[] = ["application/vnd.google-apps.folder"].concat(this.readableMimetypes)
        const mimeTypesQuery = mimeTypes.map(mimeType => `mimeType = '${mimeType}'`).join(" or ")

        // add shortcut to the mimetypes
        const targetMimeTypesQuery = mimeTypes.map(mimeType => `shortcutDetails.targetMimeType = '${mimeType}'`).join(" or ")
        const shortcutQuery = `mimeType = 'application/vnd.google-apps.shortcut' and (${targetMimeTypesQuery})`

        queryParts.push(`${mimeTypesQuery} or (${shortcutQuery})`)
      }

      listParams = {
        pageSize: 1000, // 1000 is max on file list operations
        fields: "files(id, mimeType, name, capabilities(canEdit), shortcutDetails), nextPageToken",
      }

      if (metadata.providerData.driveType === EDriveType.sharedWithMe) {
        listParams.corpora = "user"
        if (metadata?.providerData.id) {
          queryParts.push(`'${metadata?.providerData.id}' in parents`)
        } else {
          queryParts.push("sharedWithMe = true")
        }
      } else {
        queryParts.push(`'${metadata?.providerData.id || 'root'}' in parents`)

        if (metadata.providerData.driveId) {
          listParams.corpora = "drive"
          listParams.driveId = metadata.providerData.driveId
          listParams.includeItemsFromAllDrives = true
          listParams.supportsAllDrives = true
        }
      }

      listParams.q = queryParts.map(p => `(${p})`).join(" and ")
    }

    const listLoop = () => {
      listApiMethod(listParams).execute((result: any) => {
        if (!result || result.error) {
          return callback(result, [])
        }
        if (listDrives) {
          if (result.drives) {
            filesOrDrives = filesOrDrives.concat(result.drives)
          }
        } else {
          if (result.files) {
            filesOrDrives = filesOrDrives.concat(result.files)
          }
        }
        if (result.nextPageToken) {
          // get the next page of results
          listParams.pageToken = result.nextPageToken
          listLoop()
        } else {
          const list = []
          for (let i = 0; i < filesOrDrives.length; i++) {
            const item = filesOrDrives[i]
            if (listDrives) {
              list.push(new CloudMetadata({
                name: item.name,
                type: CloudMetadata.Folder,
                parent: metadata,
                overwritable: false,
                provider: this,
                providerData: {
                  id: item.id,
                  driveType: EDriveType.sharedDrives,
                  driveId: item.id
                }
              }))
            } else {
              const type = item.mimeType === 'application/vnd.google-apps.folder' ? CloudMetadata.Folder : CloudMetadata.File
              if ((type === CloudMetadata.Folder) || this.matchesExtension(item.name, readableExtensions)) {
                list.push(new CloudMetadata({
                  name: item.name,
                  type,
                  parent: metadata,
                  overwritable: item.capabilities?.canEdit,
                  provider: this,
                  providerData: {
                    id: item.id,
                    driveType: metadata.providerData.driveType,
                    driveId: metadata.providerData.driveId,
                    shortcutDetails: item.shortcutDetails,
                  }
                }))
              }
            }
          }
          callback(null, list)
        }
      })
    }

    listLoop()
  }

  list(metadata: CloudMetadata, callback: ProviderListCallback, options: IListOptions) {
    this.authorized((isAuthorized) => {
      if (isAuthorized) {

        // return the top level drives for the root
        if (metadata === null) {
          return callback(null, this.topLevelDrives())
        }

        this.getAllFilesOrDrives(metadata, (err: any, filesOrDrives: any[]) => {
          if (err) {
            return callback(this.apiError(err, 'Unable to list files'))
          }

          filesOrDrives.sort((a, b) => {
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
          callback(null, filesOrDrives)
        }, options)
      }
      else {
        callback(null, [])
      }
    })
  }

  remove(metadata: CloudMetadata, callback?: ProviderRemoveCallback) {
    return this.waitForAPILoad().then(() => {
      const request = gapi.client.drive.files["delete"]({
        fileId: metadata.providerData.id})
      return request.execute((result: any) => callback?.(result?.error))
    })
  }

  rename(metadata: CloudMetadata, newName: string, callback?: (err: string | null, metadata?: CloudMetadata) => void) {
    return this.waitForAPILoad().then(() => {
      const request = gapi.client.drive.files.update({
        fileId: metadata.providerData.id,
        resource: {
          name: CloudMetadata.withExtension(newName)
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

  close(metadata: CloudMetadata, callback: ProviderCloseCallback) {}
    // nothing to do now that the realtime library was removed

  canOpenSaved() { return true }

  openSaved(openSavedParams: any, callback: ProviderLoadCallback) {
    const parts = openSavedParams.split(OpenSavedParamDelimiter)
    const rawMetadata: any = {
      type: CloudMetadata.File,
      provider: this,
      providerData: {
        id: parts[0]
      }
    }
    if (parts.length > 1) {
      rawMetadata.providerData.driveId = parts[1]
    }
    const metadata = new CloudMetadata(rawMetadata)
    return this.load(metadata, (err: string | null, content: any) => callback(err, content, metadata))
  }

  getOpenSavedParams(metadata: CloudMetadata) {
    const parts = [metadata.providerData.id]
    if (metadata.providerData.driveId) {
      parts.push(metadata.providerData.driveId)
    }
    return parts.join(OpenSavedParamDelimiter)
  }

  getFileDialogMessage() {
    if (this.user) {
      return (
        div({className: "provider-message"},
          div({}, span({style: {marginRight: 5}}, tr("~GOOGLE_DRIVE.USERNAME_LABEL")), strong({}, this.user.name)),
          div({className: "provider-message-action", onClick: this.logout.bind(this)}, tr("~GOOGLE_DRIVE.SELECT_DIFFERENT_ACCOUNT"))
        )
      )
    }
  }

  fileDialogDisabled(folder: CloudMetadata) {
    // disable the open/save dialog until a folder or drive is selected
    if (!folder || (folder.providerData.driveType === EDriveType.sharedDrives) && !folder.providerData.driveId) {
      return true
    }
    return false
  }

  logout() {
    this.user = null
    this.authToken = null
    this.promptForConsent = true
    gapi.client.setToken(null)
    this.onAuthorizationChangeCallback?.(false)
  }

  onAuthorizationChange(callback: OnAuthorizationChangeCallback) {
    this.onAuthorizationChangeCallback = callback
  }

  isAuthorizationRequired() {
    return true
  }

  waitForAPILoad() {
    return GoogleDriveProvider.apiLoadPromise || (GoogleDriveProvider.apiLoadPromise = Promise.all([this.waitForGISLoad(), this.waitForGAPILoad()]))
  }

  private waitForGAPILoad() {
    return GoogleDriveProvider.gapiLoadPromise || (GoogleDriveProvider.gapiLoadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = "https://apis.google.com/js/api.js"
      script.onload = () => {
        gapi.load("client", () => {
          gapi.client.init({})
          .then(() => {
            gapi.client.load("https://www.googleapis.com/discovery/v1/apis/drive/v3/rest")
            gapi.client.load('https://www.googleapis.com/discovery/v1/apis/oauth2/v1/rest')
            resolve()
          })
          .catch(reject)  // eslint-disable-line @typescript-eslint/dot-notation
        })
      }
      document.head.appendChild(script)
    }))
  }

  private waitForGISLoad() {
    return GoogleDriveProvider.gisLoadPromise || (GoogleDriveProvider.gisLoadPromise = new Promise<void>((resolve) => {
      const script = document.createElement('script')
      script.src = "https://accounts.google.com/gsi/client"
      script.onload = () => {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: this.scopes
        })
        resolve()
      }
      document.head.appendChild(script)
    }))
  }

  private loadFile(metadata: CloudMetadata, callback: ProviderLoadCallback) {
    const fileId = metadata.providerData.shortcutDetails?.targetId || metadata.providerData.id
    const params: any = {
      fileId,
      fields: "id, mimeType, name, parents, capabilities(canEdit)",
    }
    const driveId = metadata.providerData.driveId
    if (driveId) {
      params.driveId = driveId
      params.supportsAllDrives = true
    }
    const request = gapi.client.drive.files.get(params)
    return request.execute((file: any) => {
      metadata.rename(file.name)
      metadata.overwritable = file.capabilities.canEdit
      metadata.providerData = {id: file.id}
      if (driveId) {
        metadata.providerData.driveId = driveId
      }
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
      xhr.open('GET', `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`)
      xhr.setRequestHeader("Authorization", `Bearer ${this.authToken.access_token}`)
      xhr.onload = () => callback(null, cloudContentFactory.createEnvelopedCloudContent(xhr.responseText))
      xhr.onerror = () => callback("Unable to download file content")
      return xhr.send()
    })
  }

  private saveFile(content: any, metadata: CloudMetadata, callback: ProviderSaveCallback) {
    const boundary = '-------314159265358979323846'
    const mimeType = metadata.mimeType || this.mimeType
    const headerContents: any = {
      name: metadata.filename,
      mimeType,
    }
    const fileId = metadata.providerData.shortcutDetails?.targetId || metadata.providerData.id
    const isUpdate = !!fileId
    const driveId = metadata.parent?.providerData.driveId

    if (!isUpdate) {
      if (metadata.parent?.providerData?.id) {
        headerContents.parents = [metadata.parent.providerData.id]
      } else {
        headerContents.parents = ["root"]
      }
    }
    if (driveId) {
      headerContents.driveId = driveId
    }
    const header = JSON.stringify(headerContents)

    const [method, path] = Array.from(isUpdate ?
      ['PATCH', `/upload/drive/v3/files/${fileId}`]
    :
      ['POST', '/upload/drive/v3/files'])

    let transferEncoding = ""
    if (mimeType.indexOf("image/") === 0) {
      // assume we're transfering any images as base64
      transferEncoding = "\r\nContent-Transfer-Encoding: base64"
    }

    const body = [
      `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${header}`,
      `\r\n--${boundary}\r\nContent-Type: ${mimeType}${transferEncoding}\r\n\r\n${(typeof content.getContentAsJSON === 'function' ? content.getContentAsJSON() : undefined) || content}`,
      `\r\n--${boundary}--`
    ].join('')

    const request = gapi.client.request({
      path,
      method,
      params: {uploadType: 'multipart', supportsAllDrives: true},
      headers: {
        'Content-Type': `multipart/related; boundary="${boundary}"`,
        'Content-Length': body.length
      },
      body
    })

    return request.execute((file: any) => {
      if (callback) {
        if (file != null ? file.error : undefined) {
          return callback(tr("~GOOGLE_DRIVE.UNABLE_TO_UPLOAD_MSG", {message: file.error.message}), file.error.code)
        } else if (file) {
          metadata.providerData = {id: file.id}
          if (driveId) {
            metadata.providerData.driveId = driveId
          }
          return callback(null, file)
        } else {
          return callback(this.apiError(file, tr("~GOOGLE_DRIVE.UNABLE_TO_UPLOAD")))
        }
      }
    })
  }

  private apiError(result: any, prefix: string) {
    if (result?.message) {
      return `${prefix}: ${result.message}`
    } else {
      return prefix
    }
  }

  private topLevelDrives() {
    const drives = [
      new CloudMetadata({name: tr("~GOOGLE_DRIVE.MY_DRIVE"), type: CloudMetadata.Folder, provider: this, providerData: {driveType: EDriveType.myDrive}}),
      new CloudMetadata({name: tr("~GOOGLE_DRIVE.SHARED_WITH_ME"), type: CloudMetadata.Folder, provider: this, providerData: {driveType: EDriveType.sharedWithMe}}),
    ]
    if (!this.options.disableSharedDrives) {
      drives.push(new CloudMetadata({name: tr("~GOOGLE_DRIVE.SHARED_DRIVES"), type: CloudMetadata.Folder, provider: this, providerData: {driveType: EDriveType.sharedDrives}}))
    }
    return drives
  }
}

export default GoogleDriveProvider
