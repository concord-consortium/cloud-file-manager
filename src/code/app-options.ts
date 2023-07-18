import { CloudContent } from "./providers/provider-interface"

export interface CFMMenuItemObject {
  name?: string;
  key?: string;
  action?: string | (() => void);
  items?: CFMMenuItem[];
  enabled?: boolean | (() => boolean);
  separator?: boolean;
}

export type CFMMenuItem = string | CFMMenuItemObject;

export type CFMMenu = CFMMenuItem[];

export interface CFMMenuBarOptions {
  info?: string;
  languageMenu?: {
    currentLang: string;
    options: { label: string, langCode: string }[];
  };
  onLangChanged?: (langCode: string) => void;
}

export interface CFMShareDialogSettings {
  serverUrl?: string;
  serverUrlLabel?: string;
}

export interface CFMUIOptions {
  menuBar?: CFMMenuBarOptions;
  menu?: CFMMenu | null;                // null => no menu; undefined => default menu
  menuNames?: Record<string, string>;   // map from menu item string to menu display name for string-only menu items
  windowTitleSuffix?: string;
  windowTitleSeparator?: string;
  newFileOpensInNewTab?: boolean;
  newFileAddsNewToQuery?: boolean;
  confirmCloseIfDirty?: boolean;
  shareDialog?: CFMShareDialogSettings;
}

export interface CFMBaseProviderOptions {
  name?: string;
  displayName?: string;
  urlDisplayName?: string;
  mimeType?: string;
  // note different capitalization from CFMAppOptions
  readableMimetypes?: string[];
}

export interface CFMReadOnlyProviderOptions extends CFMBaseProviderOptions {
  src: string;
  alphabetize: boolean;
  json: any;
  jsonCallback: (callback: (err: string | null, json: any) => void) => void;
}

export interface CFMPatchProviderOptions extends CFMBaseProviderOptions {
  patch?: boolean;
  patchObjectHash?: (obj: any) => string;
}

export interface CFMLaraProviderLogData {
  operation: string;
  documentID?: string;
  documentUrl?: string;
  runStateUrl?: string;
  run_remote_endpoint?: string;
  collaboratorUrls?: string[];
}

export interface CFMLaraProviderOptions extends CFMPatchProviderOptions {
  logLaraData?: (laraData: CFMLaraProviderLogData) => void;
}

export interface CFMDocumentStoreProviderOptions extends CFMPatchProviderOptions {
  deprecationPhase: number;
}

export interface CFMGoogleDriveProviderOptions extends CFMBaseProviderOptions {
  clientId: string;
  apiKey: string;
  scopes?: string[];
  disableSharedDrives?: boolean;
}

export interface CFMCustomClientProviderOptions extends CFMBaseProviderOptions {
  createProvider: (providerBase: any) => any;
}

export const isCustomClientProvider = (options: CFMProviderOptions): options is CFMCustomClientProviderOptions =>
              (options as any).createProvider != null

export type CFMProviderOptions = CFMBaseProviderOptions | CFMReadOnlyProviderOptions | CFMLaraProviderOptions |
                                CFMDocumentStoreProviderOptions | CFMGoogleDriveProviderOptions |
                                CFMCustomClientProviderOptions;

export type ContentLoadFilterFn = (clientContent: CloudContent) => any;
export type ContentSaveFilterFn = (clientContent: CloudContent) => any;

export interface CFMHashParams {
  sharedContentId?: string;
  fileParams?: string;
  copyParams?: string;
  newInFolderParams?: string;
}

export interface CFMAppOptions {
  autoSaveInterval?: number;
  appName?: string;
  appVersion?: string;
  appBuildNum?: string;
  appOrMenuElemId?: string;
  hideMenuBar?: boolean;
  ui?: CFMUIOptions;
  appSetsWindowTitle?: boolean;
  wrapFileContent?: boolean;
  mimeType?: string;
  // note different capitalization from CFMBaseProviderOptions
  readableMimeTypes?: string[];
  extension?: string;
  readableExtensions?: string[];
  enableLaraSharing?: boolean;
  log?: (event: string, eventData: any) => void;
  providers?: (CFMProviderOptions | string)[];
  hashParams?: CFMHashParams;
  sendPostMessageClientEvents?: boolean;
  usingIframe?: boolean;
  app?: string;   // required when iframing - relative path to the app to wrap
  contentLoadFilter?: ContentLoadFilterFn;
  contentSaveFilter?: ContentSaveFilterFn;
  iframeAllow?: string;
}
