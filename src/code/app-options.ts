export interface CFMMenuItem {
  name: string;
  action?: string | (() => void);
  items?: CFMMenuItem[];
}

export interface CFMUIOptions {
  menuBar?: {
    info: string;
    languageMenu?: {
      currentLang: string;
      options: { label: string, langCode: string }[];
    };
    onLangChanged?: (langCode: string) => void;
  };
  menu?: CFMMenuItem[];
  windowTitleSuffix?: string;
  windowTitleSeparator?: string;
  newFileOpensInNewTab?: boolean;
  newFileAddsNewToQuery?: boolean;
  confirmCloseIfDirty?: boolean;
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
}

export interface CFMPatchProviderOptions extends CFMBaseProviderOptions {
  patch: boolean;
  patchObjectHash: (obj: any) => string;
}

export interface CFMLaraProviderOptions extends CFMPatchProviderOptions {
  logLaraData: (obj: any) => void;
}

export interface CFMDocumentStoreProviderOptions extends CFMPatchProviderOptions {
  deprecationPhase: () => number;
}

export interface CFMGoogleDriveProviderOptions extends CFMBaseProviderOptions {
  clientId: string;
  apiKey: string;
}

export interface CFMCustomClientProviderOptions extends CFMBaseProviderOptions {
  createProvider: (providerBase: any) => any;
}

export const isCustomClientProvider = (options: CFMProviderOptions): options is CFMCustomClientProviderOptions =>
              (options as any).createProvider != null

export type CFMProviderOptions = CFMBaseProviderOptions | CFMReadOnlyProviderOptions | CFMLaraProviderOptions |
                                CFMDocumentStoreProviderOptions | CFMGoogleDriveProviderOptions |
                                CFMCustomClientProviderOptions;

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
}
