import React from "react"
import isString  from '../utils/is-string'
import _ from 'lodash'

const FILE_EXTENSION_DELIMETER = "."

type providerType = ProviderInterface
type providerDataType = any  // Not sure what this is
type documentId = string
type key = string
type mimeType = string

type AnyForNow = any
export type GenericFileCallback = (arg: AnyForNow) => AnyForNow

// TODO: What does a save callback signature really looklike?
export type callbackSigSave = GenericFileCallback

// TODO: What does a load callback signature really looklike?
export type callbackSigLoad = (err:AnyForNow, content:AnyForNow, metadata?: CloudMetadata) => AnyForNow

// TODO: What does a list callback signature really looklike?
export type callbackSigList = (err:AnyForNow, content:AnyForNow, metadata?: CloudMetadata) => AnyForNow


// TODO: What does a rename callback signature really looklike?
export type callbackSigRename = GenericFileCallback

// TODO: What does a list callback signature really looklike?
export type callbackSigRemove = GenericFileCallback

// TODO: What does a close callback signature really looklike?
export type callbackSigClose = GenericFileCallback

// TODO: What does a open-save callback signature really looklike?
export type callbackSigOpenSave = GenericFileCallback

// TODO: When the document is shared, this is the callback signature
export type callbackSigShare = (err: string, content: AnyForNow) => void

export enum ICloudFileTypes {
  File = "file",
  Folder = "folder",
  Label = "label",
  Extension = "extension"
}

export interface ICloudMetaDataSpec {
  name: string
  docName?: string  // TODO: why is this used?
  description: string
  content: any
  url: string
  type: ICloudFileTypes
  provider: providerType
  parent: ICloudMetaDataSpec|null
  providerData: providerDataType
  overwritable: boolean
  sharedContentId: documentId
  sharedContentSecretKey: key
  mimeType: mimeType
  filename: string
  ReadableExtensions?: string[]
  _permissions?: any,
  shareEditKey?: string,
  sharedDocumentId?: string,
  sharedDocumentUrl?: string,
  accessKeys?: {
    readOnly?: string,
    readWrite?: string
  }
}

type CloudFileContentType = string
interface ICloudFileOpts {
  content: CloudFileContentType
  metadata: ICloudMetaDataSpec
}

class CloudFile {
  content: CloudFileContentType
  metadata: ICloudMetaDataSpec
  constructor(options: ICloudFileOpts) {
    ({content: this.content, metadata: this.metadata} = options)
  }
}

class CloudMetadata implements ICloudMetaDataSpec {
  name: string
  docName?: string  // TODO: why is this used?
  description: string
  content: any
  url: string
  type: ICloudFileTypes
  provider: providerType
  parent: ICloudMetaDataSpec
  providerData: providerDataType
  overwritable: boolean
  sharedContentId: documentId
  sharedContentSecretKey: key
  mimeType: mimeType
  filename: string|null
  _permissions?: any
  shareEditKey?: string
  sharedDocumentId?: string
  sharedDocumentUrl?: string
  accessKeys?: {
    readOnly?: string
    readWrite?: string
  }

  static Folder = 'folder'
  static File = 'file'
  static Label = 'label'

  // TODO IMPORTANT: These are defined as class variables,
  // which seems like a mistake. Seems like it should match
  // the mimeType, which is an instance variable.
  static Extension: string|null = null
  static ReadableExtensions: string[]

  constructor(options: Partial<ICloudMetaDataSpec>) {
    let provider, parent, providerData
    this.name = options.name
    this.type = options.type
    this.description = options.description
    this.content = options.content
    this.url = options.url
    provider = options.provider
    this.provider = provider != null ? provider : null
    parent = options.parent
    this.parent = parent
    providerData = options.providerData
    this.providerData = providerData != null ? providerData : {}
    this.overwritable = options.overwritable
    this.sharedContentId = options.sharedContentId
    this.sharedContentSecretKey = options.sharedContentSecretKey
    this.mimeType = options.mimeType
    this._updateFilename()
  }


  static mapTypeToCloudMetadataType(iType: ICloudFileTypes) {
    return iType || ICloudFileTypes.File
  }

  static nameIncludesExtension(name:string) {
    return name.indexOf(FILE_EXTENSION_DELIMETER) >= 0
  }

  static withExtension(name: string, defaultExtension:string, keepOriginalExtension:boolean) {
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

  static newExtension(name: string, extension:string) {
    // drop last extension, if there is one
    name = name.substr(0, name.lastIndexOf('.')) || name
    return name + "." + extension
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
    return this._updateFilename()
  }

  _updateFilename() {
    this.filename = this.name
    if (((this.name != null ? this.name.substr : undefined) != null) && (CloudMetadata.Extension != null) && (this.type === CloudMetadata.File)) {
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
  setEnvelopeMetadata(envelopeMetadata:IEnvelopeMetaData) {
    let key: keyof typeof envelopeMetadata
    for (key in envelopeMetadata) {
      this.envelopeMetadata[key] = envelopeMetadata[key]
    }
  }

  // returns new CloudContent containing enveloped data
  createEnvelopedCloudContent(content: CloudContent) {
    return new CloudContent(this.envelopContent(content), this._identifyContentFormat(content))
  }

  // envelops content with metadata, returns an object.
  // If content was already an object (Object or JSON) with metadata,
  // any existing metadata will be retained.
  // Note: calling `envelopContent` may be safely called on something that
  // has already had `envelopContent` called on it, and will be a no-op.
  envelopContent(content: CloudContent) {
    const envelopedCloudContent:any = this._wrapIfNeeded(content)
    let key: keyof IEnvelopeMetaData
    for (key in this.envelopeMetadata) {
      if (envelopedCloudContent[key] == null) {
        envelopedCloudContent[key] = this.envelopeMetadata[key]
      }
    }
    return envelopedCloudContent
  }

  _identifyContentFormat(content: CloudContent | string) {
    if ((content == null)) { return }
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
        // 'cfmWrapped' means meta-data is top-level, and content
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
  _wrapIfNeeded(content: string | CloudContent) {
    if (isString(content)) {
      try { content = JSON.parse(content) } catch (error) {
        // noop, just cecking if it's json or plain text
      }
    }
    if ((content as CloudContent)?.content != null) {
      return content
    } else {
      return {content}
    }
  }
}

interface ICloudContentFormat {
  isCfmWrapped: boolean
  isPreCfmFormat: boolean
}

class CloudContent {
  static wrapFileContent: boolean = true

  // TODO: These should probably be private, but there is some refactoring
  // that has to happen to make this possible
  cfmVersion?: string
  metadata?: any
  content : any
  contentFormat: ICloudContentFormat
  constructor(content:any, contentFormat:any) {
    this.content = content == null
      ? {}
      : content
    this.contentFormat = contentFormat
  }

  // getContent and getContentAsJSON return the file content as stored on disk
  getContent() {
    if (CloudContent.wrapFileContent) { return this.content } else { return this.content.content }
  }

  getContentAsJSON() {
    return JSON.stringify(this.getContent())
  }

  // returns the client-visible content (excluding wrapper for wrapped clients)
  getClientContent() {
    return this.content.content
  }

  requiresConversion() {
    return (CloudContent.wrapFileContent !== (this.contentFormat != null ? this.contentFormat.isCfmWrapped : undefined)) || (this.contentFormat != null ? this.contentFormat.isPreCfmFormat : undefined)
  }

  clone() {
    const newContent = _.cloneDeep(this.content)
    const newContentFormat = _.cloneDeep(this.contentFormat)
    return new CloudContent(newContent, newContentFormat)
  }

  setText(text: string) { return this.content.content = text }
  getText() { if (this.content.content === null) { return '' } else if (isString(this.content.content)) { return this.content.content } else { return JSON.stringify(this.content.content) } }

  addMetadata(metadata: Partial<ICloudMetaDataSpec>) {
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
    const shared: Partial<ICloudMetaDataSpec> = {}
    if (this.content._permissions != null){
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
    const metadata: Partial<ICloudMetaDataSpec> = {}
    for (let key of Object.keys(this.content || {})) {
      const value = this.content[key]
      if (key !== 'content') {
        // TOOD: We could probably enumerate the keys
        // and not have to do this any cast
        (metadata as any)[key] = value
      }
    }
    return to.addMetadata(metadata as ICloudMetaDataSpec)
  }
}

enum ECapabilities {
  save='save',
  resave='resave',
  load='load',
  list='list',
  remove='remove',
  rename='rename',
  close='close',
  export='export'
}

type IProviderCapabilities = {
  [c in ECapabilities]?: boolean | 'auto'
}

export interface IProviderInterfaceOpts {
  name: string,
  displayName: string,
  urlDisplayName: string,
  capabilities: IProviderCapabilities
}

class ProviderInterface implements IProviderInterfaceOpts {
  name: string
  displayName: string
  urlDisplayName: string
  capabilities: IProviderCapabilities

  constructor(options: IProviderInterfaceOpts) {
    ({name: this.name, displayName: this.displayName, urlDisplayName: this.urlDisplayName, capabilities: this.capabilities} = options)
  }

  static Available() { return true }

  // TODO: do we need metadata, saw two different sigs in code
  // see saveAsExport
  can(capability: ECapabilities, metadata?: ICloudMetaDataSpec) {
    return !!this.capabilities[capability]
  }

  canAuto(capability: ECapabilities) {
    return this.capabilities[capability] === 'auto'
  }

  isAuthorizationRequired() {
    return false
  }

  authorized(callback: (resp: boolean) => boolean) {
    return callback ? callback(true) : true
  }

  renderAuthorizationDialog() {
    console.warn('renderAuthorizationDialog not implemented')
  }

  renderUser() {
    console.warn('renderUser not implemented')
  }

  filterTabComponent(capability: ECapabilities, defaultComponent: React.Component) {
    return defaultComponent
  }

  matchesExtension(name:string) {
    if (!name) { return false }
    if ((CloudMetadata.ReadableExtensions != null) && (CloudMetadata.ReadableExtensions.length > 0)) {
      for (let extension of CloudMetadata.ReadableExtensions) {
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

  dialog(callback: (opts:any) => any) {
    return this._notImplemented('dialog')
  }


  save(content: any, metadata: ICloudMetaDataSpec, callback: callbackSigSave) {
    return this._notImplemented('save')
  }

  saveAsExport(content: any, metadata: ICloudMetaDataSpec, callback: callbackSigSave) {
    // default implementation invokes save
    if (this.can(ECapabilities.save, metadata)) {
      return this.save(content, metadata, callback)
    } else {
      return this._notImplemented('saveAsExport')
    }
  }

  load(metadata: ICloudMetaDataSpec, callback: callbackSigLoad) {
    return this._notImplemented('load')
  }

  list(metadata: ICloudMetaDataSpec, callback: callbackSigList) {
    return this._notImplemented('list')
  }

  remove(metadata: ICloudMetaDataSpec, callback: callbackSigRemove) {
    return this._notImplemented('remove')
  }

  rename(metadata: ICloudMetaDataSpec, newName: string, callback: callbackSigRename) {
    return this._notImplemented('rename')
  }

  close(metadata: ICloudMetaDataSpec, callback: callbackSigClose) {
    return this._notImplemented('close')
  }

  setFolder(metadata: ICloudMetaDataSpec) {
    return this._notImplemented('setFolder')
  }

  canOpenSaved() { return false }

  openSaved(openSavedParams: any, callback: callbackSigOpenSave) {
    return this._notImplemented('openSaved')
  }

  getOpenSavedParams(metadata: ICloudMetaDataSpec) {
    return this._notImplemented('getOpenSavedParams')
  }

  fileOpened() {}
    // do nothing by default

  _notImplemented(methodName: string) {
    // this uses a browser alert instead of client.alert because this is just here for debugging
    // eslint-disable-next-line no-alert
    return alert(`${methodName} not implemented for ${this.name} provider`)
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
