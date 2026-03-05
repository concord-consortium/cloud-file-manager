import React, { useState, useEffect, useRef, useCallback } from 'react'
import { CFMGoogleDriveProviderOptions } from '../app-options'
import { CloudFileManagerClient } from '../client'
import tr, { getDefaultLang } from '../utils/translate'
import {
  AuthorizedOptions,
  cloudContentFactory, CloudMetadata, ECapabilities, ICloudFileTypes, ProviderCloseCallback, ProviderInterface,
  ProviderLoadCallback, ProviderRemoveCallback, ProviderSaveCallback
} from './provider-interface'

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

interface GoogleFileDialogTabViewProps {
  client: CloudFileManagerClient
  dialog: { action: string }
  provider: GoogleDriveProvider
  user: { name: string } | null
  logout: () => void
  onConfirm: (metadata: CloudMetadata) => void
  onCancel: () => void
}

const GoogleFileDialogTabView: React.FC<GoogleFileDialogTabViewProps> = ({
  client,
  dialog,
  provider,
  user,
  onConfirm,
  onCancel
}) => {
  const [filename, setFilename] = useState(
    client.state.metadata?.name ?? tr("~MENUBAR.UNTITLED_DOCUMENT")
  )
  const ref = useRef<HTMLDivElement>(null)
  const filenameRef = useRef<HTMLInputElement>(null)
  const pickerRef = useRef<any>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const isOpen = useCallback(() => dialog.action === "openFile", [dialog.action])
  const isSave = useCallback(() => !isOpen(), [isOpen])

  const save = useCallback(() => {
    const trimmedFilename = filename.trim()
    if (trimmedFilename.length === 0) {
      return
    }

    const metadata = new CloudMetadata({
      name: trimmedFilename,
      type: ICloudFileTypes.File,
      overwritable: true,
      provider: provider,
      providerData: {
        id: null
      }
    })

    onConfirm(metadata)
  }, [filename, provider, onConfirm])

  const cancel = useCallback(() => {
    onCancel()
  }, [onCancel])

  const pickerCallback = useCallback((data: any) => {
    const { readableExtensions } = client.appOptions

    if (data.action === google.picker.Action.PICKED) {
      const document = data[google.picker.Response.DOCUMENTS][0]
      const type = document[google.picker.Document.TYPE]
      const pickedName = document[google.picker.Document.NAME]
      let name = pickedName
      let fileId = document[google.picker.Document.ID]
      let parentId = document[google.picker.Document.PARENT_ID]

      if (type === "folder") {
        name = filename
        parentId = fileId
        fileId = null
      } else {
        if (readableExtensions && readableExtensions.length > 0) {
          const hasValidExtension = readableExtensions.map((ex: string) => ex.trim()).reduce((result: boolean, extension: string) => {
            return result || pickedName.endsWith(`.${extension}`) || extension.length === 0
          }, false)
          if (!hasValidExtension) {
            client.alert(tr("~GOOGLE_DRIVE.SELECT_VALID_FILE"), tr("~GOOGLE_DRIVE.SELECT_A_FILE"))
            return
          }
        }

        if (isSave() && (filename !== tr("~MENUBAR.UNTITLED_DOCUMENT"))) {
          name = filename
        }
      }

      const parent = parentId ? new CloudMetadata({
        type: CloudMetadata.Folder,
        provider: provider,
        providerData: {
          id: parentId
        }
      }) : undefined

      const pickedMetadata = new CloudMetadata({
        name,
        type: ICloudFileTypes.File,
        parent,
        overwritable: true,
        provider: provider,
        providerData: {
          id: fileId
        }
      })

      if (isOpen()) {
        onConfirm(pickedMetadata)
      } else {
        const finishSave = () => onConfirm(pickedMetadata)

        if (fileId) {
          const prompt = tr("~FILE_DIALOG.OVERWRITE_CONFIRM", {filename: pickedName})
          client.confirm(prompt, finishSave)
        } else {
          finishSave()
        }
      }
    }
    // DON'T call cancel on google.picker.Action.CANCEL so we keep the outer dialog open
  }, [client, filename, isOpen, isSave, onConfirm, provider])

  const showPicker = useCallback((mode: "file" | "folder") => {
    const { options, readableMimetypes } = provider
    const { apiKey, appId } = options!
    const mimeTypes = mode === "file" ? readableMimetypes.join(",") : "nonsense-mimetype-to-filter-out-files/kajhdflkajfhaslkdjfhasdlfkjhsdfkljh"

    const myDriveView = new google.picker.DocsView(google.picker.ViewId.DOCS)
    const starredView = new google.picker.DocsView(google.picker.ViewId.DOCS)
    const sharedView = new google.picker.DocsView(google.picker.ViewId.DOCS)
    const drivesView = new google.picker.DocsView(google.picker.ViewId.DOCS)

    myDriveView.setMimeTypes(mimeTypes)
    starredView.setMimeTypes(mimeTypes)
    sharedView.setMimeTypes(mimeTypes)
    drivesView.setMimeTypes(mimeTypes)

    myDriveView.setMode(google.picker.DocsViewMode.LIST)
    starredView.setMode(google.picker.DocsViewMode.LIST)
    sharedView.setMode(google.picker.DocsViewMode.LIST)
    drivesView.setMode(google.picker.DocsViewMode.LIST)

    myDriveView.setIncludeFolders(true)
    starredView.setIncludeFolders(true)
    sharedView.setIncludeFolders(true)
    drivesView.setIncludeFolders(true)

    if (mode === "folder") {
      myDriveView.setSelectFolderEnabled(true)
      starredView.setSelectFolderEnabled(true)
      sharedView.setSelectFolderEnabled(true)
      drivesView.setSelectFolderEnabled(true)
    }

    myDriveView.setOwnedByMe(true)
    starredView.setStarred(true)
    drivesView.setEnableDrives(true)

    // setLabel is in an internal api, so it may go away
    myDriveView.setLabel?.(tr("~GOOGLE_DRIVE.MY_DRIVE"))
    sharedView.setLabel?.(tr("~GOOGLE_DRIVE.SHARED_WITH_ME"))
    drivesView.setLabel?.(tr("~GOOGLE_DRIVE.SHARED_DRIVES"))
    starredView.setLabel?.(`★ ${tr("~GOOGLE_DRIVE.STARRED")}`)

    pickerRef.current = new google.picker.PickerBuilder()
      .setLocale(getDefaultLang())
      .setDeveloperKey(apiKey)
      .setAppId(appId)
      .setOAuthToken(provider.authToken.access_token)
      .setTitle(mode === "file" ? tr("~GOOGLE_DRIVE.SELECT_A_FILE") : tr("~GOOGLE_DRIVE.SELECT_A_FOLDER"))
      .addView(myDriveView)
      .addView(sharedView)
      .addView(drivesView)
      .addView(starredView)
      .setCallback(pickerCallback)
      .build()
    pickerRef.current.setVisible(true)
  }, [provider, pickerCallback])

  useEffect(() => {
    // listen for when we are visible to auto show the picker on open requests
    observerRef.current = new IntersectionObserver((entries) => {
      if (isOpen()) {
        if (entries.find(e => e.isIntersecting)) {
          showPicker("file")
        }
      }
    }, { root: ref.current?.parentElement })

    if (ref.current) {
      observerRef.current.observe(ref.current)
    }

    return () => {
      pickerRef.current?.setVisible(false)
      pickerRef.current?.dispose()
      if (ref.current && observerRef.current) {
        observerRef.current.unobserve(ref.current)
      }
    }
  }, [isOpen, showPicker])

  const filenameChanged = () => {
    if (filenameRef.current) {
      setFilename(filenameRef.current.value)
    }
  }

  const renderLogo = () => {
    return <div className="google-drive-concord-logo" />
  }

  const renderUserInfo = () => {
    if (user) {
      return (
        <div className="provider-message">
          <div><span style={{ marginRight: 5 }}>{tr("~GOOGLE_DRIVE.USERNAME_LABEL")}</span><strong>{user.name}</strong></div>
          {/* HOTFIX: remove this until we can figure out why it is requesting more scopes */}
          {/* <div className="provider-message-action" onClick={logout}>{tr("~GOOGLE_DRIVE.SELECT_DIFFERENT_ACCOUNT")}</div> */}
        </div>
      )
    }
    return null
  }

  const renderOpen = () => {
    return (
      <div className="dialogTab googleFileDialogTab openDialog" ref={ref}>
        {renderLogo()}
        <div className="main-buttons">
          <button onClick={() => showPicker("file")}>{tr("~GOOGLE_DRIVE.REOPEN_DRIVE")}</button>
        </div>
        {renderUserInfo()}
        <div className="buttons">
          <button onClick={cancel}>{tr("~FILE_DIALOG.CANCEL")}</button>
        </div>
      </div>
    )
  }

  const renderSave = () => {
    const canSave = filename.trim().length > 0
    const saveClassName = canSave ? "" : "disabled"
    return (
      <div className="dialogTab googleFileDialogTab saveDialog" ref={ref}>
        <input
          type="text"
          ref={filenameRef}
          value={filename}
          placeholder={tr("~FILE_DIALOG.FILENAME")}
          onChange={filenameChanged}
        />
        {renderLogo()}
        <div className="main-buttons">
          <button onClick={save} className={saveClassName} disabled={!canSave}>{tr("~GOOGLE_DRIVE.QUICK_SAVE")}</button>
          <button onClick={() => showPicker("folder")} className={saveClassName} disabled={!canSave}>{tr("~GOOGLE_DRIVE.PICK_FOLDER")}</button>
          <button onClick={() => showPicker("file")} className={saveClassName} disabled={!canSave}>{tr("~GOOGLE_DRIVE.PICK_FILE")}</button>
        </div>
        {renderUserInfo()}
        <div className="buttons">
          <button onClick={cancel}>{tr("~FILE_DIALOG.CANCEL")}</button>
        </div>
      </div>
    )
  }

  return isOpen() ? renderOpen() : renderSave()
}

interface GoogleDriveAuthorizationDialogProps {
  provider: GoogleDriveProvider
}

const GoogleDriveAuthorizationDialog: React.FC<GoogleDriveAuthorizationDialogProps> = ({ provider }) => {
  const [apiLoadState, setApiLoadState] = useState(provider.apiLoadState)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    // Set up the global state setter for external updates
    setGoogleDriveAuthorizationDialogState = (newState: any) => {
      if (newState.apiLoadState !== undefined) {
        setApiLoadState(newState.apiLoadState)
      }
    }

    // Wait for API to load
    provider.waitForAPILoad().then(() => {
      if (isMountedRef.current) {
        setApiLoadState(provider.apiLoadState)
      }
    })

    return () => {
      isMountedRef.current = false
    }
  }, [provider])

  const authenticate = () => {
    // we rely on the fact that the prior call to authorized has set the callback
    // we need here
    provider.authorize(provider.authCallback)
  }

  const messageMap: Record<ELoadState, React.ReactNode> = {
    [ELoadState.notLoaded]: tr("~GOOGLE_DRIVE.CONNECTING_MESSAGE"),
    [ELoadState.loaded]: <button onClick={authenticate}>{tr("~GOOGLE_DRIVE.LOGIN_BUTTON_LABEL")}</button>,
    [ELoadState.errored]: tr("~GOOGLE_DRIVE.ERROR_CONNECTING_MESSAGE"),
    [ELoadState.missingScopes]: (
      <div className="google-drive-missing-scopes">
        <div>{tr("~GOOGLE_DRIVE.MISSING_SCOPES_MESSAGE")}</div>
        <div><button onClick={authenticate}>{tr("~GOOGLE_DRIVE.LOGIN_BUTTON_LABEL")}</button></div>
      </div>
    ),
  }
  const contents = messageMap[apiLoadState as ELoadState] || "An unknown error occurred!"

  return (
    <div className="google-drive-auth">
      <div className="google-drive-concord-logo" />
      <div className="google-drive-footer">
        {contents}
      </div>
    </div>
  )
}

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
  static gisLoadPromise: Promise<unknown> | null = null
  static gapiLoadPromise: Promise<unknown> | null = null
  static apiLoadPromise: Promise<unknown> | null = null
  _autoRenewTimeout!: number
  apiKey: string
  authCallback!: (authorized: boolean) => void
  authToken: any
  tokenClient: any
  client: CloudFileManagerClient
  clientId: string
  appId: string
  apiLoadState: ELoadState
  mimeType: string
  options?: CFMGoogleDriveProviderOptions
  readableMimetypes: string[] = []
  extension!: string
  readableExtensions!: string[]
  scopes: string
  user: any
  onAuthorizationChangeCallback: OnAuthorizationChangeCallback | undefined
  promptForConsent!: boolean

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
    this.apiKey = this.options?.apiKey ?? ''
    this.clientId = this.options?.clientId ?? ''
    this.appId = this.options?.appId ?? ''
    if (!this.apiKey) {
      throw new Error((tr("~GOOGLE_DRIVE.ERROR_MISSING_APIKEY")))
    }
    if (!this.clientId) {
      throw new Error((tr("~GOOGLE_DRIVE.ERROR_MISSING_CLIENTID")))
    }
    if (!this.appId) {
      throw new Error((tr("~GOOGLE_DRIVE.ERROR_MISSING_APPID")))
    }
    this.scopes = (this.options?.scopes || [
      'https://www.googleapis.com/auth/drive.install',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]).join(" ")
    this.mimeType = this.options?.mimeType || "text/plain"
    this.readableMimetypes = this.options?.readableMimetypes ?? []

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
          gapi.client.oauth2.userinfo.get().then(({ result }: any) => {
            this.user = result
            this.authToken = tokenResponse
            if (typeof this.authCallback === 'function') {
              this.authCallback(true)
            }
          })
        } else {
          setGoogleDriveAuthorizationDialogState?.({ apiLoadState: ELoadState.missingScopes })
        }
      }

      if (!immediate) {
        this.tokenClient.requestAccessToken({ prompt: this.promptForConsent ? 'consent' : '' })
      }
    })
  }

  authorize(callback: any) {
    this.authCallback = callback
    // Calling doAuthorize with immediate set to false permits an authorization
    // dialog, if necessary
    this.doAuthorize(!GoogleDriveProvider.IMMEDIATE)
  }

  renderAuthorizationDialog() {
    return <GoogleDriveAuthorizationDialog provider={this} />
  }

  renderUser() {
    if (this.user) {
      return <span className="gdrive-user"><span className="gdrive-icon" />{this.user.name}</span>
    } else {
      return null
    }
  }

  renderFileDialogTabView(fileDialogTabViewProps: any) {
    return <GoogleFileDialogTabView {...fileDialogTabViewProps} user={this.user} logout={this.logout.bind(this)} />
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

  remove(metadata: CloudMetadata, callback?: ProviderRemoveCallback) {
    return this.waitForAPILoad().then(() => {
      const request = gapi.client.drive.files["delete"]({
        fileId: metadata.providerData.id
      })
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

  close(metadata: CloudMetadata, callback: ProviderCloseCallback) { }
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
          gapi.load('client:picker', () => {
            gapi.client.init({})
              .then(() => {
                gapi.client.load("https://www.googleapis.com/discovery/v1/apis/drive/v3/rest")
                gapi.client.load('https://www.googleapis.com/discovery/v1/apis/oauth2/v1/rest')
                resolve()
              })
              .catch(reject)  // eslint-disable-line @typescript-eslint/dot-notation
          })
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
      metadata.providerData = { id: file.id }
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
      xhr.onload = () => {
        switch (xhr.status) {
          case 200:
            callback(null, cloudContentFactory.createEnvelopedCloudContent(xhr.responseText))
            break
          case 403:
            callback("Sorry, you do not have access to the requested file")
            break
          default:
            callback(`Unable to download file content: Error ${xhr.status}`)
            break
        }
      }
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
      const parentId = metadata.parent?.providerData.shortcutDetails?.targetId || metadata.parent?.providerData.id
      headerContents.parents = [parentId || "root"]
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
      params: { uploadType: 'multipart', supportsAllDrives: true },
      headers: {
        'Content-Type': `multipart/related; boundary="${boundary}"`,
        'Content-Length': body.length
      },
      body
    })

    return request.execute((file: any) => {
      if (callback) {
        if (file != null ? file.error : undefined) {
          return callback(tr("~GOOGLE_DRIVE.UNABLE_TO_UPLOAD_MSG", { message: file.error.message }), file.error.code)
        } else if (file) {
          metadata.providerData = { id: file.id }
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
      new CloudMetadata({ name: tr("~GOOGLE_DRIVE.MY_DRIVE"), type: CloudMetadata.Folder, provider: this, providerData: { driveType: EDriveType.myDrive } }),
      new CloudMetadata({ name: tr("~GOOGLE_DRIVE.SHARED_WITH_ME"), type: CloudMetadata.Folder, provider: this, providerData: { driveType: EDriveType.sharedWithMe } }),
    ]
    if (!this.options?.disableSharedDrives) {
      drives.push(new CloudMetadata({ name: tr("~GOOGLE_DRIVE.SHARED_DRIVES"), type: CloudMetadata.Folder, provider: this, providerData: { driveType: EDriveType.sharedDrives } }))
    }
    return drives
  }
}

export default GoogleDriveProvider
