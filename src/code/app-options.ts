import React from "react"
import { CloudContent } from "./providers/provider-interface"

export interface CFMMenuItemObject {
  name?: string
  key?: string
  action?: string | (() => void)
  items?: CFMMenuItem[]
  enabled?: boolean | (() => boolean)
  separator?: boolean
}

export type CFMMenuItem = string | CFMMenuItemObject

export type CFMMenu = CFMMenuItem[]

export interface CFMMenuBarOptions {
  info?: string
  languageMenu?: {
    currentLang: string
    options: { label: string, langCode: string }[]
  }
  onLangChanged?: (langCode: string) => void
}

export interface CFMShareDialogSettings {
  serverUrl?: string
  serverUrlLabel?: string
}

export interface CFMUIOptions {
  menuBar?: CFMMenuBarOptions
  // null => no menu; undefined => default menu
  menu?: CFMMenu | null
  // map from menu item string to menu display name for string-only menu items
  menuNames?: Record<string, string>
  // used for setting the page title from the document name (see appSetsWindowTitle)
  windowTitleSuffix?: string
  windowTitleSeparator?: string
  newFileOpensInNewTab?: boolean
  newFileAddsNewToQuery?: boolean
  // if true, adds `beforeunload` handler to request confirmation before leaving page
  confirmCloseIfDirty?: boolean
  shareDialog?: CFMShareDialogSettings
}

export interface CFMBaseProviderOptions {
  name?: string
  displayName?: string
  urlDisplayName?: string
  mimeType?: string
  // note different capitalization from CFMAppOptions
  readableMimetypes?: string[]
}

export interface CFMReadOnlyProviderOptions extends CFMBaseProviderOptions {
  src: string
  alphabetize: boolean
  json: any
  jsonCallback: (callback: (err: string | null, json: any) => void) => void
}

export interface CFMPatchProviderOptions extends CFMBaseProviderOptions {
  patch?: boolean
  patchObjectHash?: (obj: any) => string
}

export interface CFMLaraProviderLogData {
  operation: string
  documentID?: string
  documentUrl?: string
  runStateUrl?: string
  run_remote_endpoint?: string
  collaboratorUrls?: string[]
}

export interface CFMLaraProviderOptions extends CFMPatchProviderOptions {
  logLaraData?: (laraData: CFMLaraProviderLogData) => void
}

export interface CFMDocumentStoreProviderOptions extends CFMPatchProviderOptions {
  deprecationPhase: number
}

export interface CFMLegacyGoogleDriveProviderOptions extends CFMBaseProviderOptions {
  clientId: string
  apiKey: string
  scopes?: string[]
  disableSharedDrives?: boolean
}

export interface CFMGoogleDriveProviderOptions extends CFMLegacyGoogleDriveProviderOptions {
  appId: string
}

export interface CFMCustomClientProviderOptions extends CFMBaseProviderOptions {
  createProvider: (providerBase: any) => any
}

export const isCustomClientProvider = (options: CFMProviderOptions): options is CFMCustomClientProviderOptions =>
              (options as any).createProvider != null

export type CFMProviderOptions = CFMBaseProviderOptions | CFMReadOnlyProviderOptions | CFMLaraProviderOptions |
                                CFMDocumentStoreProviderOptions | CFMGoogleDriveProviderOptions |
                                CFMCustomClientProviderOptions

export type ContentLoadFilterFn = (clientContent: CloudContent) => any
export type ContentSaveFilterFn = (clientContent: CloudContent) => any

export interface CFMHashParams {
  sharedContentId?: string
  fileParams?: string
  copyParams?: string
  newInFolderParams?: string
}

export interface CFMAppOptions {
  // seconds (or milliseconds if > 1000), auto-save disabled by default
  autoSaveInterval?: number
  appName?: string
  appVersion?: string
  appBuildNum?: string
  // If appOrMenuElemId is set and usingIframe is true, then the CFM presents
  // its UI and the wrapped client app within the specified element.
  // If appOrMenuElemId is set and usingIframe is false, then the CFM presents its menubar
  // UI within the specified element, but there is no iframe or wrapped client app.
  appOrMenuElemId?: string
  // true if the menu bar should be hidden, false (default) otherwise
  hideMenuBar?: boolean
  ui?: CFMUIOptions
  // true if the application sets the page title
  // false (default) if CFM sets page title from document name
  appSetsWindowTitle?: boolean
  wrapFileContent?: boolean
  mimeType?: string
  // note different capitalization from CFMBaseProviderOptions
  readableMimeTypes?: string[]
  extension?: string
  readableExtensions?: string[]
  enableLaraSharing?: boolean
  log?: (event: string, eventData: any) => void
  providers?: (CFMProviderOptions | string)[]
  hashParams?: CFMHashParams
  sendPostMessageClientEvents?: boolean
  // if true, client app is wrapped in an iframe within the CFM-managed div
  usingIframe?: boolean
  // required when iframing - relative path to the app to wrap
  app?: string
  // called to preprocess content when loading files
  contentLoadFilter?: ContentLoadFilterFn
  // called to preprocess content when saving files
  contentSaveFilter?: ContentSaveFilterFn
  // allow clients to customize rendering, e.g. for React 18
  renderRoot?: (content: React.ReactNode, container: HTMLElement) => void
  // when usingIframe, specifies the `allow` property of the iframe (permissions policy)
  iframeAllow?: string
}
