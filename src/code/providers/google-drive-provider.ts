import tr  from '../utils/translate'
import { ProviderInterface }  from './provider-interface'
import { cloudContentFactory }  from './provider-interface'
import { CloudMetadata }  from './provider-interface'

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
    return this.props.provider.authorize((GoogleDriveProvider as any).SHOW_POPUP)
  },

  render() {
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const contents = {
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      "not-loaded": tr("~GOOGLE_DRIVE.CONNECTING_MESSAGE"),
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      "loaded": button({onClick: this.authenticate}, (tr("~GOOGLE_DRIVE.LOGIN_BUTTON_LABEL"))),
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      "errored": tr("~GOOGLE_DRIVE.ERROR_CONNECTING_MESSAGE")
    }[this.state.gapiLoadState] || "An unknown error occurred!"
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
  IMMEDIATE: any;
  Name: any;
  SHOW_POPUP: any;
  _autoRenewTimeout: any;
  apiKey: any;
  authCallback: any;
  authToken: any;
  client: any;
  clientId: any;
  gapiLoadState: any;
  mimeType: any;
  options: any;
  readableMimetypes: any;
  scopes: any;
  user: any;

  static initClass() {
    (this as any).Name = 'googleDrive';

    // aliases for boolean parameter to authorize
    (this as any).IMMEDIATE = true;
    (this as any).SHOW_POPUP = false
  }

  constructor(options: any, client: any) {
    const opts = options || {}
    super({
      name: (GoogleDriveProvider as any).Name,
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      displayName: opts.displayName || (tr('~PROVIDER.GOOGLE_DRIVE')),
      urlDisplayName: opts.urlDisplayName,
      capabilities: {
        save: true,
        resave: true,
        'export': true,
        load: true,
        list: true,
        remove: false,
        rename: true,
        close: true,
        // @ts-expect-error ts-migrate(2322) FIXME: Type '{ save: true; resave: true; export: true; lo... Remove this comment to see the full error message
        setFolder: true
      }
    })
    this.options = opts
    this.client = client
    this.authToken = null
    this.user = null
    this.apiKey = this.options.apiKey
    this.clientId = this.options.clientId
    if (!this.apiKey) {
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
      throw new Error((tr("~GOOGLE_DRIVE.ERROR_MISSING_APIKEY")))
    }
    if (!this.clientId) {
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
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

    this.gapiLoadState = "not-loaded"
    this._waitForGAPILoad()
      .then(() => this.gapiLoadState = "loaded")
      .catch(() => this.gapiLoadState = "errored")  // eslint-disable-line @typescript-eslint/dot-notation
  }

  authorized(authCallback: any) {
    if (!(authCallback == null)) { this.authCallback = authCallback }
    if (authCallback) {
      if (this.authToken) {
        return authCallback(true)
      } else {
        return this.authorize((GoogleDriveProvider as any).IMMEDIATE)
      }
    } else {
      return this.authToken !== null
    }
  }

  authorize(immediate: any) {
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
        auth.isSignedIn.listen(() => {
          finishAuthorization()
        })
        if (!immediate) {
          auth.signIn()
        } else {
          finishAuthorization()
        }
      }
    })
  }

  autoRenewToken(authToken: any) {
    if (this._autoRenewTimeout) {
      clearTimeout(this._autoRenewTimeout)
    }
    if (authToken && !authToken.error) {
      return this._autoRenewTimeout = setTimeout((() => this.authorize((GoogleDriveProvider as any).IMMEDIATE)), (parseInt(authToken.expires_in, 10) * 0.75) * 1000)
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

  save(content: any, metadata: any, callback: any) {
    return this._waitForGAPILoad().then(() => {
      return this._saveFile(content, metadata, callback)
    })
  }

  load(metadata: any, callback: any) {
    return this._waitForGAPILoad().then(() => {
      return this._loadFile(metadata, callback)
    })
  }

  list(metadata: any, callback: any) {
    return this._waitForGAPILoad().then(() => {
      const mimeTypesQuery = (this.readableMimetypes || []).map((mimeType: any) => `mimeType = '${mimeType}'`).join(" or ")
      const request = gapi.client.drive.files.list({
        fields: "files(id, mimeType, name, capabilities(canEdit))",
        q: `trashed = false and (${mimeTypesQuery} or mimeType = 'application/vnd.google-apps.folder') and '${metadata ? metadata.providerData.id : 'root'}' in parents`
      })
      return request.execute((result: any) => {
        if (!result || result.error) { return callback(this._apiError(result, 'Unable to list files')) }
        const list = []
        const files = result.files
        if (files?.length > 0) {
          for (let i = 0; i < files.length; i++) {
            const item = files[i]
            const type = item.mimeType === 'application/vnd.google-apps.folder' ? (CloudMetadata as any).Folder : (CloudMetadata as any).File
            if ((type === (CloudMetadata as any).Folder) || this.matchesExtension(item.name)) {
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
          if (lowerA < lowerB) { return -1 }
          if (lowerA > lowerB) { return 1 }
          return 0
        })
        return callback(null, list)
      })
    })
  }

  remove(metadata: any, callback: any) {
    return this._waitForGAPILoad().then(() => {
      const request = gapi.client.drive.files["delete"]({
        fileId: metadata.providerData.id})
      return request.execute((result: any) => typeof callback === 'function' ? callback((result != null ? result.error : undefined) || null) : undefined)
    })
  }

  rename(metadata: any, newName: any, callback: any) {
    return this._waitForGAPILoad().then(() => {
      const request = gapi.client.drive.files.patch({
        fileId: metadata.providerData.id,
        resource: {
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 1.
          title: CloudMetadata.withExtension(newName)
        }
      })
      return request.execute((result: any) => {
        if (result != null ? result.error : undefined) {
          return (typeof callback === 'function' ? callback(result.error) : undefined)
        } else {
          metadata.rename(newName)
          return callback(null, metadata)
        }
      })
    })
  }

  close(metadata: any, callback: any) {}
    // nothing to do now that the realtime library was removed

  canOpenSaved() { return true }

  openSaved(openSavedParams: any, callback: any) {
    const metadata = new CloudMetadata({
      type: (CloudMetadata as any).File,
      provider: this,
      providerData: {
        id: openSavedParams
      }
    })
    return this.load(metadata, (err: any, content: any) => callback(err, content, metadata))
  }

  getOpenSavedParams(metadata: any) {
    return metadata.providerData.id
  }

  isAuthorizationRequired() {
    return true
  }

  _waitForGAPILoad() {
    return new Promise((resolve, reject) => {
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
    })
  }

  _loadFile(metadata: any, callback: any) {
    const request = gapi.client.drive.files.get({
      fileId: metadata.providerData.id,
      fields: "id, mimeType, name, parents, capabilities(canEdit)",
    })
    return request.execute((file: any) => {
      metadata.rename(file.name)
      metadata.overwritable = file.capabilities.canEdit
      metadata.providerData = {id: file.id}
      metadata.mimeType = file.mimeType
      if ((metadata.parent == null) && ((file.parents != null ? file.parents.length : undefined) > 0)) {
        metadata.parent = new CloudMetadata({
          type: (CloudMetadata as any).Folder,
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

  _saveFile(content: any, metadata: any, callback: any) {
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
          return callback(`Unabled to upload file: ${file.error.message}`)
        } else if (file) {
          metadata.providerData = {id: file.id}
          return callback(null, file)
        } else {
          return callback(this._apiError(file, 'Unabled to upload file'))
        }
      }
    })
  }

  _apiError(result: any, prefix: any) {
    if ((result != null ? result.message : undefined) != null) {
      return `${prefix}: ${result.message}`
    } else {
      return prefix
    }
  }
}
GoogleDriveProvider.initClass()

export default GoogleDriveProvider

function __guard__(value: any, transform: any) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}
