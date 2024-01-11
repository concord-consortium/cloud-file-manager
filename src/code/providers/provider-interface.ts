import React from "react"
import isString  from '../utils/is-string'
import _ from 'lodash'

const FILE_EXTENSION_DELIMETER = "."

export type ProviderSaveCallback = (err: string | null, statusCode?: number, savedContent?: any) => void

export type ProviderOpenCallback = (err: string | null, content?: CloudContent, metadata?: CloudMetadata) => void
export type ProviderLoadCallback = ProviderOpenCallback

export type ProviderListCallback = (err: string | null, list?: CloudMetadata[]) => void

export type ProviderRenameCallback = (err: string | null, metadata?: CloudMetadata) => void

export type ProviderRemoveCallback = (err: string) => void

export type ProviderCloseCallback = (err: string) => void

// TODO: When the document is shared, this is the callback signature
export type ProviderShareCallback = (err: string, data?: string) => void

export enum ICloudFileTypes {
  File = "file",
  Folder = "folder",
  Label = "label",
  Extension = "extension"
}

type CloudFileContentType = string
interface ICloudFileOpts {
  content: CloudFileContentType
  metadata: CloudMetadata
}

class CloudFile {
  content: CloudFileContentType
  metadata: CloudMetadata
  constructor(options: ICloudFileOpts) {
    ({content: this.content, metadata: this.metadata} = options)
  }
}

class CloudMetadata {
  name: string
  docName?: string  // TODO: why is this used?
  description: string
  content: CloudContent | string  // string is used in special cases; cf. ReadOnlyProvider
  contentType?: string
  url: string
  type: ICloudFileTypes
  provider: ProviderInterface
  parent: CloudMetadata
  providerData: any
  overwritable: boolean
  sharedContentId: string
  sharedContentSecretKey: string
  mimeType: string
  filename: string|null
  extension?: string
  _permissions?: number
  shareEditKey?: string
  sharedDocumentId?: string
  sharedDocumentUrl?: string
  accessKeys?: {
    readOnly?: string
    readWrite?: string
  }
  autoSaveDisabled?: boolean

  static Folder = ICloudFileTypes.Folder
  static File = ICloudFileTypes.File
  static Label = ICloudFileTypes.Label

  // TODO IMPORTANT: These are defined as class variables,
  // which seems like a mistake. Seems like it should match
  // the mimeType, which is an instance variable.
  static Extension: string|null = null
  static ReadableExtensions: string[]

  constructor(options: Partial<CloudMetadata>) {
    this.name = options.name
    this.type = options.type
    this.description = options.description
    this.content = options.content
    this.url = options.url
    this.provider = options.provider ?? null
    this.parent = options.parent
    this.providerData = options.providerData ?? {}
    // default to true for overwritable
    this.overwritable = options.overwritable ?? true
    this.sharedContentId = options.sharedContentId
    this.sharedContentSecretKey = options.sharedContentSecretKey
    this.mimeType = options.mimeType
    this.updateFilename()
  }


  static mapTypeToCloudMetadataType(iType: ICloudFileTypes) {
    return iType || ICloudFileTypes.File
  }

  static nameIncludesExtension(name: string) {
    return name.indexOf(FILE_EXTENSION_DELIMETER) >= 0
  }

  static withExtension(name: string, defaultExtension?: string, keepOriginalExtension?: boolean) {
    if (keepOriginalExtension && this.nameIncludesExtension(name)) {
      return name
    }
    const extension = this.Extension || defaultExtension
    if (extension) {
      return this.newExtension(name, extension)
    } else {
      return name
    }
  }

  static newExtension(name: string, extension: string) {
    // replace the existing extension(s) with the passed extension
    const parts = name.split(".")
    return parts[0] + "." + extension
  }

  path() {
    const _path = []
    let { parent } = this
    while (parent !== null) {
      _path.unshift(parent);
      ({ parent } = parent)
    }
    return _path
  }

  rename(newName: string) {
    this.name = newName
    return this.updateFilename()
  }

  updateFilename() {
    this.filename = this.name
    if (((this.name != null ? this.name.substr : undefined) != null) && (CloudMetadata.Extension != null) && (this.type === ICloudFileTypes.File)) {
      const extLen = CloudMetadata.Extension.length
      if (extLen > 0) {
        // at this point the filename and name are the same so we now check for a file extension
        const hasCurrentExtension = this.name.substr(-extLen-1) === `.${CloudMetadata.Extension}`
        if (hasCurrentExtension) {
          // remove extension from name for display purposes
          return this.name = this.name.substr(0, this.name.length - (extLen+1))
        } else {
          // add extension to filename for saving purposes
          return this.filename += `.${CloudMetadata.Extension}`
        }
      }
    }
  }
}

//TODO: What are the actual keys we expect to find?
interface IEnvelopeMetaData {
  cfmVersion: string
  appName: string
  appVersion: string
  appBuildNum: string
}

// singleton that can create CloudContent wrapped with global options
class CloudContentFactory {
  envelopeMetadata: IEnvelopeMetaData
  constructor() {
    this.envelopeMetadata = {
      // replaced by version number at build time
      cfmVersion: '__PACKAGE_VERSION__',
      appName: '',
      appVersion: '',
      appBuildNum: ''
    }
  }

  // set initial envelopeMetadata or update individual properties
  setEnvelopeMetadata(envelopeMetadata: IEnvelopeMetaData) {
    let key: keyof typeof envelopeMetadata
    for (key in envelopeMetadata) {
      this.envelopeMetadata[key] = envelopeMetadata[key]
    }
  }

  // returns new CloudContent containing enveloped data
  createEnvelopedCloudContent(content: any) {
    return new CloudContent(this.envelopContent(content), this._identifyContentFormat(content))
  }

  // envelops content with metadata, returns an object.
  // If content was already an object (Object or JSON) with metadata,
  // any existing metadata will be retained.
  // Note: calling `envelopContent` may be safely called on something that
  // has already had `envelopContent` called on it, and will be a no-op.
  envelopContent(content: any): CloudContent {
    return { ...this.envelopeMetadata, ...this._wrapIfNeeded(content) }
  }

  _identifyContentFormat(content?: any): CloudContentFormat | undefined {
    if (content == null) return
    const result = { isCfmWrapped: false, isPreCfmFormat: false }
    if (isString(content)) {
      try { content = JSON.parse(content) } catch (error) {
        // noop, just checking if it's valid json
      }
    }
    // Currently, we assume 'metadata' is top-level property in
    // non-CFM-wrapped documents. Could put in a client callback
    // that would identify whether the document required
    // conversion to eliminate this assumption from the CFM.
    if ((content as CloudContent).metadata) {
      return result
    }
    if (
        // 'cfmWrapped' means CFM metadata is top-level, and content
        // can be found inside content.content
        ((content as CloudContent).cfmVersion != null) ||
        ((content as CloudContent).content != null)) {
      result.isCfmWrapped = true
    } else {
      result.isPreCfmFormat = true
    }
    return result
  }

  // envelops content in {content: content} if needed, returns an object
  _wrapIfNeeded(content: any): any {
    if (isString(content)) {
      try { content = JSON.parse(content) } catch (error) {
        // noop, just checking if it's json or plain text
      }
    }
    if ((typeof content === "object") && (content?.content != null)) {
      return content
    } else {
      return {content}
    }
  }
}

export interface CloudContentFormat {
  isCfmWrapped: boolean
  isPreCfmFormat: boolean
}

class CloudContent {
  static wrapFileContent: boolean = true

  // TODO: These should probably be private, but there is some refactoring
  // that has to happen to make this possible
  cfmVersion?: string
  metadata?: CloudMetadata
  content: any
  contentFormat: CloudContentFormat
  constructor(content: any, contentFormat: CloudContentFormat) {
    this.content = content ?? {}
    this.contentFormat = contentFormat
  }

  // getContent and getContentAsJSON return the file content as stored on disk
  getContent() {
    return CloudContent.wrapFileContent
            ? this.content
            : this.content.content
  }

  getContentAsJSON() {
    return JSON.stringify(this.getContent())
  }

  // returns the client-visible content (excluding wrapper for wrapped clients)
  getClientContent() {
    return this.content.content ?? this.content
  }

  requiresConversion() {
    return (CloudContent.wrapFileContent !== this.contentFormat?.isCfmWrapped) || this.contentFormat?.isPreCfmFormat
  }

  clone() {
    const newContent = _.cloneDeep(this.content)
    const newContentFormat = _.cloneDeep(this.contentFormat)
    return new CloudContent(newContent, newContentFormat)
  }

  setText(text: string) { return this.content.content = text }
  getText() {
    return this.content.content == null
            ? ''
            : isString(this.content.content)
              ? this.content.content
              : JSON.stringify(this.content.content)
  }

  addMetadata(metadata: Partial<CloudMetadata>) {
    const result = []
    for (let key in metadata) {
      result.push(this.content[key] = (metadata as any)[key])
    }
    return result
  }

  get(prop: string) {
    return this.content[prop]
  }

  set(prop: string, value: any) {
    this.content[prop] = value
  }

  remove(prop: string) {
    delete this.content[prop]
  }


  getSharedMetadata() {
    // only include necessary fields
    const shared: Partial<CloudMetadata> = {}
    if (this.content._permissions != null) {
      shared._permissions = this.content._permissions
    }
    if (this.content.shareEditKey != null) {
      shared.shareEditKey = this.content.shareEditKey
    }
    if (this.content.sharedDocumentId != null) {
      shared.sharedDocumentId = this.content.sharedDocumentId }
    if (this.content.sharedDocumentUrl != null) {
      shared.sharedDocumentUrl = this.content.sharedDocumentUrl }
    if (this.content.accessKeys != null) {
      shared.accessKeys = this.content.accessKeys }
    return shared
  }

  copyMetadataTo(to: CloudContent) {
    const metadata: Partial<CloudMetadata> = {}
    for (let key of Object.keys(this.content || {})) {
      const value = this.content[key]
      if (key !== 'content') {
        // TODO: We could probably enumerate the keys
        // and not have to do this any cast
        (metadata as any)[key] = value
      }
    }
    return to.addMetadata(metadata as CloudMetadata)
  }
}

export enum ECapabilities {
  save='save',
  resave='resave',
  load='load',
  list='list',
  remove='remove',
  rename='rename',
  close='close',
  export='export',
  setFolder='setFolder'
}

type IProviderCapabilities = {
  [c in ECapabilities]?: boolean | 'auto'
}

export type AuthorizedOptions = {forceAuthorization?: boolean}

export interface IProviderInterfaceOpts {
  name: string             // name by which it is referenced internally
  displayName?: string     // name which is displayed to users
  urlDisplayName?: string  // name that is used for url parameter matching
  capabilities: IProviderCapabilities
}

export interface IListOptions {
  extension?: string
}

abstract class ProviderInterface implements IProviderInterfaceOpts {
  name: string
  displayName?: string
  urlDisplayName?: string
  capabilities: IProviderCapabilities

  constructor(options: IProviderInterfaceOpts) {
    ({name: this.name, displayName: this.displayName, urlDisplayName: this.urlDisplayName, capabilities: this.capabilities} = options)
  }

  static Available() { return true }

  static hasValidOptions(options: any) { return true }

  // TODO: do we need metadata, saw two different sigs in code
  // see saveAsExport
  can(capability: ECapabilities, metadata?: CloudMetadata) {
    return !!this.capabilities[capability]
  }

  canAuto(capability: ECapabilities) {
    return this.capabilities[capability] === 'auto'
  }

  isAuthorizationRequired() {
    return false
  }

  authorized(callback: (resp: boolean) => void, options?: AuthorizedOptions) {
    callback?.(true)
  }

  authorize(...args: any) {
    console.warn('authorize not implemented')
  }

  renderAuthorizationDialog() {
    console.warn('renderAuthorizationDialog not implemented')
  }

  renderUser() {
    console.warn('renderUser not implemented')
  }

  filterTabComponent(capability: ECapabilities, defaultComponent: React.Component): React.Component | null {
    return defaultComponent
  }

  matchesExtension(name: string, extensions?: string[]) {
    if (!name) { return false }
    extensions = extensions || CloudMetadata.ReadableExtensions
    if (extensions?.length) {
      for (let extension of extensions) {
        if (name.substr(-extension.length) === extension) { return true }
        if (extension === "") {
          if (name.indexOf(".") === -1) { return true }
        }
      }
      return false
    } else {
      // may seem weird but it means that without an extension specified all files match
      return true
    }
  }

  handleUrlParams() {
    return false // by default, no additional URL handling
  }

  dialog(callback: (opts: any) => any) {
    return this._notImplemented('dialog')
  }


  save(content: any, metadata: CloudMetadata, callback?: ProviderSaveCallback, disablePatch?: boolean) {
    return this._notImplemented('save')
  }

  saveAsExport(content: any, metadata: CloudMetadata, callback?: ProviderSaveCallback) {
    // default implementation invokes save
    if (this.can(ECapabilities.save, metadata)) {
      return this.save(content, metadata, callback)
    } else {
      return this._notImplemented('saveAsExport')
    }
  }

  load(metadata: CloudMetadata, callback?: ProviderLoadCallback) {
    return this._notImplemented('load')
  }

  list(metadata: CloudMetadata, callback?: ProviderListCallback, options?: IListOptions) {
    return this._notImplemented('list')
  }

  remove(metadata: CloudMetadata, callback?: ProviderRemoveCallback) {
    return this._notImplemented('remove')
  }

  rename(metadata: CloudMetadata, newName: string, callback?: ProviderRenameCallback) {
    return this._notImplemented('rename')
  }

  close(metadata: CloudMetadata, callback?: ProviderCloseCallback) {
    return this._notImplemented('close')
  }

  setFolder(metadata: CloudMetadata) {
    return this._notImplemented('setFolder')
  }

  canOpenSaved() { return false }

  openSaved(openSavedParams: any, callback?: ProviderOpenCallback) {
    return this._notImplemented('openSaved')
  }

  getOpenSavedParams(metadata: CloudMetadata): string | Record<string, string> | void {
    this._notImplemented('getOpenSavedParams')
  }

  fileOpened(content: CloudContent, metadata: CloudMetadata) {}
    // do nothing by default

  _notImplemented(methodName: string) {
    // this uses a browser alert instead of client.alert because this is just here for debugging
    // eslint-disable-next-line no-alert
    alert(`${methodName} not implemented for ${this.name} provider`)
  }

  fileDialogDisabled(folder: CloudMetadata): boolean {
    // allow providers to disable the file dialog
    return false
  }
}

const cloudContentFactory = new CloudContentFactory()

export {
  CloudFile,
  CloudMetadata,
  CloudContent,
  cloudContentFactory,
  ProviderInterface
}
