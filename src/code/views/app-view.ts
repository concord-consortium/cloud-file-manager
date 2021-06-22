// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import _ from "lodash"
import React from "react"
import ReactDOMFactories from "react-dom-factories"
import { createReactFactory, createReactClassFactory } from "../create-react-factory"
import menuBarView from './menu-bar-view'
import providerTabbedDialogView from './provider-tabbed-dialog-view'
import downloadDialogView from './download-dialog-view'
import renameDialogView from './rename-dialog-view'
import shareDialogView from './share-dialog-view'
import blockingModalView from './blocking-modal-view'
import alterDialogView from './alert-dialog-view'
import confirmDialogView from './confirm-dialog-view'
import importTabbedDialgView from './import-tabbed-dialog-view'

const MenuBar = createReactFactory(menuBarView)
const ProviderTabbedDialog = createReactFactory(providerTabbedDialogView)
const DownloadDialog = createReactFactory(downloadDialogView)
const RenameDialog = createReactFactory(renameDialogView)
const ShareDialog = createReactFactory(shareDialogView)
const BlockingModal = createReactFactory(blockingModalView)
const AlertDialog = createReactFactory(alterDialogView)
const ConfirmDialog = createReactFactory(confirmDialogView)
const ImportTabbedDialog = createReactFactory(importTabbedDialgView)

import tr from '../utils/translate'
import isString from '../utils/is-string'
import { CloudMetadata } from "../providers/provider-interface"
import { CFMMenuBarOptions, CFMMenuItem, CFMShareDialogSettings, CFMUIOptions } from "../app-options"
import { CloudFileManagerClient, CloudFileManagerClientEvent } from "../client"
import { CloudFileManagerUIEvent } from "../ui"

const {div, iframe} = ReactDOMFactories

const InnerApp = createReactClassFactory({

  displayName: 'CloudFileManagerInnerApp',

  shouldComponentUpdate(nextProps: any) {
    return nextProps.app !== this.props.app
  },

  render() {
    return (div({className: 'innerApp'},
      (iframe({src: this.props.app}))
    ))
  }
})

interface IAppViewProps {
  client?: CloudFileManagerClient;
  ui?: CFMUIOptions;
  appOrMenuElemId?: string;
  hideMenuBar?: boolean;
  enableLaraSharing?: boolean;
  usingIframe?: boolean;
  app?: string;   // src url for <iframe>
}

interface IAppViewState {
  filename: string | null;
  provider?: any;
  menuItems: CFMMenuItem[];
  menuOptions: CFMMenuBarOptions;
  providerDialog: null | Record<string, any>;
  downloadDialog: null | Record<string, any>;
  renameDialog: null | Record<string, any>;
  shareDialog: null | CFMShareDialogSettings;
  blockingModalProps: null | Record<string, any>;
  alertDialog: null | Record<string, any>;
  confirmDialog: null | Record<string, any>;
  importDialog: null | Record<string, any>;
  fileStatus?: { message: string, type: string };
  dirty: boolean;
}

class AppView extends React.Component<IAppViewProps, IAppViewState> {
  displayName: string;
  state: IAppViewState;

  constructor(props: any) {
    super(props)
    this.displayName = 'CloudFileManager'
    this.state = {
      filename: this.getFilename(this.props.client.state.metadata),
      provider: this.props.client.state.metadata?.provider,
      menuItems: this.props.client._ui.menu?.items || [],
      menuOptions: this.props.ui?.menuBar || {},
      providerDialog: null,
      downloadDialog: null,
      renameDialog: null,
      shareDialog: null,
      blockingModalProps: null,
      alertDialog: null,
      confirmDialog: null,
      importDialog: null,
      dirty: false
    }
  }

  getFilename(metadata: CloudMetadata) {
    return metadata?.name || null
  }

  componentDidMount() {
    this.props.client.listen((event: CloudFileManagerClientEvent) => {
      const fileStatus = (() => {
        let message
        if (event.state.saving) {
          return {message: tr('~FILE_STATUS.SAVING'), type: 'info'}
        } else if (event.state.saved) {
          const providerName = event.state.metadata.provider?.displayName
          message = providerName
            ? tr('~FILE_STATUS.SAVED_TO_PROVIDER', { providerName })
            : tr('~FILE_STATUS.SAVED')
          return {message, type: 'info'}
        } else if (event.state.failures) {
          return {message: tr('~FILE_STATUS.FAILURE'), type: 'alert'}
        } else if (event.state.dirty) {
          return {message: tr('~FILE_STATUS.UNSAVED'), type: 'alert'}
        } else {
          return null
        }
      })()
      this.setState({
        filename: this.getFilename(event.state.metadata),
        provider: (event.state.metadata != null ? event.state.metadata.provider : undefined),
        fileStatus
      })

      switch (event.type) {
        case 'connected':
          return this.setState({menuItems: (this.props.client._ui.menu != null ? this.props.client._ui.menu.items : undefined) || []})
      }
  })

    return this.props.client._ui.listen((event: CloudFileManagerUIEvent) => {
      const {menuOptions} = this.state
      switch (event.type) {
        case 'showProviderDialog':
          return this.setState({providerDialog: event.data})
        case 'showDownloadDialog':
          return this.setState({downloadDialog: event.data})
        case 'showRenameDialog':
          return this.setState({renameDialog: event.data})
        case 'showImportDialog':
          return this.setState({importDialog: event.data})
        case 'showShareDialog':
          return this.setState({shareDialog: event.data})
        case 'showBlockingModal':
          return this.setState({blockingModalProps: event.data})
        case 'hideBlockingModal':
          return this.setState({blockingModalProps: null})
        case 'showAlertDialog':
          return this.setState({alertDialog: event.data})
        case 'showConfirmDialog':
          return this.setState({confirmDialog: event.data})
        case 'appendMenuItem':
          this.state.menuItems.push(event.data)
          return this.setState({menuItems: this.state.menuItems})
        case 'prependMenuItem':
          this.state.menuItems.unshift(event.data)
          return this.setState({menuItems: this.state.menuItems})
        case 'replaceMenuItem':
          var index = this._getMenuItemIndex(event.data.key)
          if (index !== -1) {
            const {menuItems} = this.state
            menuItems[index] = event.data.item
            this.setState({menuItems: menuItems})
            return this.setState({menuItems: this.state.menuItems})
          }
          break
        case 'insertMenuItemBefore':
          index = this._getMenuItemIndex(event.data.key)
          if (index !== -1) {
            if (index === 0) {
              this.state.menuItems.unshift(event.data.item)
            } else {
              this.state.menuItems.splice(index, 0, event.data.item)
            }
            return this.setState({menuItems: this.state.menuItems})
          }
          break
        case 'insertMenuItemAfter':
          index = this._getMenuItemIndex(event.data.key)
          if (index !== -1) {
            if (index === (this.state.menuItems.length - 1)) {
              this.state.menuItems.push(event.data.item)
            } else {
              this.state.menuItems.splice(index + 1, 0, event.data.item)
            }
            return this.setState({menuItems: this.state.menuItems})
          }
          break
        case 'setMenuBarInfo':
          menuOptions.info = event.data
          this.setState({menuOptions: menuOptions})
          return this.setState({menuOptions: this.state.menuOptions})
      }
    })
  }

  _getMenuItemIndex = (key: string) => {
    let index
    if (isString(key)) {
      for (index = 0; index < this.state.menuItems.length; index++) {
        const item = this.state.menuItems[index]
        const itemKey = typeof item === "string" ? item : item.key
        if (itemKey === key) { return index }
      }
      return -1
    } else {
      // TODO: seems like this was designed to support specifying an item by index, but
      // since the key is always a string (which is the only way parseInt makes sense),
      // the code can never reach this else branch, so apparently it's unused.
      index = parseInt(key, 10)
      if (isNaN(index) || (index < 0) || (index > (this.state.menuItems.length - 1))) {
        return -1
      } else {
        return index
      }
    }
  }

  closeDialogs = () => {
    return this.setState({
      providerDialog: null,
      downloadDialog: null,
      renameDialog: null,
      shareDialog: null,
      importDialog: null
    })
  }

  closeAlert = () => {
    return this.setState({alertDialog: null})
  }

  closeConfirm = () => {
    return this.setState({confirmDialog: null})
  }

  renderDialogs = () => {
    return (div({},
      (() => {
      if (this.state.blockingModalProps) {
        return (BlockingModal(this.state.blockingModalProps))
      } else if (this.state.providerDialog) {
        return (ProviderTabbedDialog({client: this.props.client, dialog: this.state.providerDialog, close: this.closeDialogs}))
      } else if (this.state.downloadDialog) {
        return (DownloadDialog({client: this.props.client, filename: this.state.downloadDialog.filename, mimeType: this.state.downloadDialog.mimeType, content: this.state.downloadDialog.content, close: this.closeDialogs}))
      } else if (this.state.renameDialog) {
        return (RenameDialog({filename: this.state.renameDialog.filename, callback: this.state.renameDialog.callback, close: this.closeDialogs}))
      } else if (this.state.importDialog) {
        return (ImportTabbedDialog({client: this.props.client, dialog: this.state.importDialog, close: this.closeDialogs}))
      } else if (this.state.shareDialog) {
        return (ShareDialog({client: this.props.client, enableLaraSharing: this.props.enableLaraSharing, close: this.closeDialogs, settings: this.props.ui?.shareDialog || {}}))
      }
    })(),

      // alert and confirm dialogs can be overlayed on other dialogs
      this.state.alertDialog ?
        (AlertDialog({title: this.state.alertDialog.title, message: this.state.alertDialog.message, callback: this.state.alertDialog.callback, close: this.closeAlert})) : undefined,
      this.state.confirmDialog ?
        (ConfirmDialog(_.merge({}, this.state.confirmDialog, { close: this.closeConfirm }))) : undefined
    ))
  }

  render() {
    const menuItems = !this.props.hideMenuBar ? this.state.menuItems : []
    if (this.props.appOrMenuElemId) {
      // CSS class depends on whether we're in app (iframe) or view (menubar-only) mode
      return (div({className: this.props.usingIframe ? 'app' : 'view' },
        (MenuBar({client: this.props.client, filename: this.state.filename, provider: this.state.provider, fileStatus: this.state.fileStatus, items: menuItems, options: this.state.menuOptions})),
        // only render the wrapped client app in app (iframe) mode
        this.props.usingIframe ?
          (InnerApp({app: this.props.app})) : undefined,
        this.renderDialogs()
      ))
    } else if (this.state.providerDialog || this.state.downloadDialog) {
      return (div({className: 'app'},
        this.renderDialogs()
      ))
    } else {
      return null
    }
  }
}

export default AppView
