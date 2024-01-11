# Cloud File Manager

The Cloud File Manager is a Javascript library that enables applications to save and load files from various file systems using a simple consistent API.  Currently the following file system providers are supported:

* [Concord Document Store](https://github.com/concord-consortium/document-store) [DEPRECATED]
* Google Drive
* Local and remote read-only files
* Browser LocalStorage (used mostly for development/testing)

## Development Setup
    npm install
    npm run build
    npm run start

and navigate to `http://localhost:8080/examples/`

### How to setup local SSL: ###

You can also install SSL certificates in `~/.localhost-ssl` and then use `npm run start:secure` to
start a secure server, which might be useful for integration testing with LARA and other services.
More info:

  1. install [mkcert](https://github.com/FiloSottile/mkcert): `brew install mkcert` (install using Scoop or Chocolatey on Windows)
  2. Create and install the trusted CA in keychain if it doesn't already exist: `mkcert -install`
  3. Ensure you have a `.localhost-ssl` certificate directory in your home directory (create if needed, typically `C:\Users\UserName` on Windows) and cd into that directory
  4. Make the cert files: `mkcert -cert-file localhost.pem -key-file localhost.key localhost 127.0.0.1 ::1`
  5. Run `npm run start:secure` to run `webpack-dev-server` in development mode with hot module replacement

## Deployment

Deployments are based on the contents of the /dist folder and are built automatically by GitHub Actions for each branch and tag pushed to GitHub.

Branches are deployed to `https://cloud-file-manager.concord.org/branch/<name>/`.

Tags are deployed to `https://cloud-file-manager.concord.org/version/<name>/`

You can view the status of all the branch and tag deploys [here](https://github.com/concord-consortium/cloud-file-manager/actions).

The production release is available at `https://cloud-file-manager.concord.org`.

Production releases are done using a manual GitHub Actions workflow. You specify which tag you want to release to production and the workflow copies all of the files in that tag's version folder to the root folder.

## Integrating Cloud File Manager

There are three ways to integrate Cloud File Manager into an application:

* Have Cloud File Manager create an iframe that wraps an application on the *same* domain - cross-domain frames are not supported by design (e.g. SageModeler).
* Install `@concord-consortium/cloud-file-manager` via npm/yarn and import/require its modules locally (e.g. CODAP v3).
* [Deprecated] Embed Cloud File Manager pre-built bundles into the application and use as a library (e.g. CODAP v2).

### Iframe Integration

On the same domain as your main application create an html file with the following structure:

```
<html>
  <head>
    <script type="text/javascript" src="/path/to/cloud-file-manager/js/globals.js"></script>
    <script type="text/javascript" src="/path/to/cloud-file-manager/js/app.js"></script>
    <link rel="stylesheet" href="/path/to/cloud-file-manager/css/app.css">
  </head>
  <body>
    <div id="wrapper">
    </div>
    <script>
      var options = {...};  // see below
      CloudFileManager.createFrame(options, "wrapper", function (event) {
        ... // optional event listener, see below
      });
    </script>
  </body>
</html>
```

where the options variable has the following optional or required settings:

```
var options = {
  app: "example-app/index.html", // required when iframing - relative path to the app to wrap
  mimeType: "application/json", // optional - defaults to text/plain
  appName: "CFM_Demo", // document store app name - required for sharing
  appVersion: "0.1", // document store app version - required for sharing
  appBuildNum: "1", // document store app build number - required for sharing
  providers: [...] // see below
  ui: {
    menu: CloudFileManager.DefaultMenu, // required - an array of string menu item names
    menuBar: {
      info: "Version 1.0.0", // optional - displayed on the right side of menubar when iframing
      help: "http://lmgtfy.com/" // optional - displayed on the right side of menubar with a ? icon when iframing
    }
  }
}
 ```

### Installation via npm/yarn

```
$ npm install @concord-consortium/cloud-file-manager
```

and then in code:

```typescript
import { CloudFileManager } from "@concord-consortium/cloud-file-manager"

  const cfm = new CloudFileManager()
  const options = {
    appOrMenuElemId: "container-div",
    ... other options as described elsewhere ...
  }
  cfm.init(options)

  function cfmEventHandler(event: CloudFileManagerClientEvent) {
    console.log("cfmEventHandler", "event.type:", event.type)
    switch(event.type) {
      ... handle various CFM events ...
    }
  }
  cfm.clientConnect(cfmEventHandler)
```

### CFM Options

```typescript
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
  confirmCloseIfDirty?: boolean
  shareDialog?: CFMShareDialogSettings
}

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
```

## Translation/Localization

The master English strings file is `src/code/utils/lang/en-US-master.json`, which is a standard JSON file except that JavaScript-style comments are allowed. (Comments are stripped before use.) Changes to English strings should be made in the master English strings file. All other language files in `src/code/utils/lang/*.json` are output files generated by script. Translations for other languages are managed via the [Cloud File Manager](https://poeditor.com/projects/view?id=125177) project (authentication required) on [POEditor](https://poeditor.com), which provides free hosting services for open source projects.

### Development

After making changes to the master English strings file (`src/code/utils/lang/en-US-master.json`), run the `strings:build` script to strip comments and deploy the `src/code/utils/lang/en-US.json` file for building:
```
npm run strings:build
```

To push changes to the master English strings file to POEditor, run the `strings:push` script:
```
npm run strings:push -- -a <poeditor-api-token>
```
The API token must be provided as an argument to the `strings:push` script or it can be set as an environment variable:
```
export POEDITOR_API_TOKEN=<poeditor-api-token>
```

To update the strings files within the project, run the `strings:pull` script:
```
npm run strings:pull -- -a <poeditor-api-token>
```
As with the `strings:push` script, the API token must be provided or be set as an environment variable. The `strings:pull` script builds the English strings as well so all strings files will be up to date.

After pulling updated strings, the modified files can be committed to git, turned into a Github Pull Request, etc. Note that POEditor supports [Github integration](https://poeditor.com/help/how_to_translate_a_language_file_from_a_github_project) which could potentially automate part of this, but that requires further investigation.

Unicode escapes are converted to their UTF-8 equivalents when pushed, i.e. strings are viewed/edited in their "user" form in POEditor, and they remain in their UTF-8 form when pulled. For characters that are better left in their Unicode escape form, such as non-printable characters like ZERO-WIDTH-SPACE ("`\u200b`") and the RIGHT-TO-LEFT-MARK ("`\u200f`"), the scripts support a custom Unicode escape sequence such that "`[u200b]`" and "`[u200f]`" are converted to "`\u200b`" and "`\u200f`" respectively when pulled.

The ZERO-WIDTH-SPACE character can be used to indicate that the empty string is the correct translation for a string in a particular language. If the string were simply left untranslated, then POEditor would 1) show it as untranslated in the POEditor UI and 2) replace it with the English string when pulled. The ZERO-WIDTH-SPACE prevents POEditor from treating the string as untranslated, but it is rendered like an empty string.

### Adding a language

To add a new language:
1. Add the language to the POEditor project
2. Add the language code to the list of languages in `bin/strings-pull-project.sh`
3. Load the new language file in `src/code/utils/translate.js`

Note that there is probably a way to eliminate the need for step 3 above by requiring all JSON files in the `src/code/utils/lang` directory (except for `en-US-master.json`), but that has not been implemented yet.

# TBD:

* Document provider options (see examples or look at code to see how they are configured for now)
* Draw a simple architecture diagram of how the client connects to the React UI using http://asciiflow.com/
* Document how to add another provider
* Document the event listener functions in both createFrame and clientConnect and how each can talk to each other


# Javascript conversion notes:

We should move to using jsx for components instead of react-create-factory:
see [this deprecation warning](https://reactjs.org/blog/2020/02/26/react-v16.13.0.html#deprecating-reactcreatefactory)


# Upgrading to Google Drive API V3

To upgrade a project to use V3 find the API key for the project in the Google Developer's Console and add it as an "apiKey" option in the provider setup (next to the existing "clientId" option)
