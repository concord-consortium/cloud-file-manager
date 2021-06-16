// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react"
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

class AppView extends React.Component {
  displayName: any;

  constructor(props: any) {
    super(props)
    this.displayName = 'CloudFileManager'
    this.state = {
      filename: this.getFilename((this.props as any).client.state.metadata),
      provider: ((this.props as any).client.state.metadata != null ? (this.props as any).client.state.metadata.provider : undefined),
      menuItems: ((this.props as any).client._ui.menu != null ? (this.props as any).client._ui.menu.items : undefined) || [],
      menuOptions: ((this.props as any).ui != null ? (this.props as any).ui.menuBar : undefined) || {},
      providerDialog: null,
      downloadDialog: null,
      renameDialog: null,
      shareDialog: null,
      alertDialog: null,
      confirmDialog: null,
      dirty: false
    }
  }

  getFilename(metadata: any) {
    return metadata?.name || null
  }

  componentDidMount() {
    (this.props as any).client.listen((event: any) => {
      const fileStatus = (() => {
        let message
        if (event.state.saving) {
          return {message: tr('~FILE_STATUS.SAVING'), type: 'info'}
        } else if (event.state.saved) {
          const providerName = event.state.metadata.provider != null
            ? event.state.metadata.provider.displayName
            : undefined
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
          return this.setState({menuItems: ((this.props as any).client._ui.menu != null ? (this.props as any).client._ui.menu.items : undefined) || []})
      }
  })

    return (this.props as any).client._ui.listen((event: any) => {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'menuOptions' does not exist on type 'Rea... Remove this comment to see the full error message
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
          (this.state as any).menuItems.push(event.data)
          return this.setState({menuItems: (this.state as any).menuItems})
        case 'prependMenuItem':
          (this.state as any).menuItems.unshift(event.data)
          return this.setState({menuItems: (this.state as any).menuItems})
        case 'replaceMenuItem':
          var index = this._getMenuItemIndex(event.data.key)
          if (index !== -1) {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'menuItems' does not exist on type 'Reado... Remove this comment to see the full error message
            const {menuItems} = this.state
            menuItems[index] = event.data.item
            this.setState({menuItems: menuItems})
            return this.setState({menuItems: (this.state as any).menuItems})
          }
          break
        case 'insertMenuItemBefore':
          index = this._getMenuItemIndex(event.data.key)
          if (index !== -1) {
            if (index === 0) {
              (this.state as any).menuItems.unshift(event.data.item)
            } else {
              (this.state as any).menuItems.splice(index, 0, event.data.item)
            }
            return this.setState({menuItems: (this.state as any).menuItems})
          }
          break
        case 'insertMenuItemAfter':
          index = this._getMenuItemIndex(event.data.key)
          if (index !== -1) {
            if (index === ((this.state as any).menuItems.length - 1)) {
              (this.state as any).menuItems.push(event.data.item)
            } else {
              (this.state as any).menuItems.splice(index + 1, 0, event.data.item)
            }
            return this.setState({menuItems: (this.state as any).menuItems})
          }
          break
        case 'setMenuBarInfo':
          menuOptions.info = event.data
          this.setState({menuOptions: menuOptions})
          return this.setState({menuOptions: (this.state as any).menuOptions})
      }
    })
  }

  _getMenuItemIndex = (key: any) => {
    let index
    if (isString(key)) {
      for (index = 0; index < (this.state as any).menuItems.length; index++) {
        const item = (this.state as any).menuItems[index]
        if (item.key === key) { return index }
      }
      return -1
    } else {
      index = parseInt(key, 10)
      if (isNaN(index) || (index < 0) || (index > ((this.state as any).menuItems.length - 1))) {
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
      if ((this.state as any).blockingModalProps) {
        return (BlockingModal((this.state as any).blockingModalProps))
      } else if ((this.state as any).providerDialog) {
        return (ProviderTabbedDialog({client: (this.props as any).client, dialog: (this.state as any).providerDialog, close: this.closeDialogs}))
      } else if ((this.state as any).downloadDialog) {
        return (DownloadDialog({client: (this.props as any).client, filename: (this.state as any).downloadDialog.filename, mimeType: (this.state as any).downloadDialog.mimeType, content: (this.state as any).downloadDialog.content, close: this.closeDialogs}))
      } else if ((this.state as any).renameDialog) {
        return (RenameDialog({filename: (this.state as any).renameDialog.filename, callback: (this.state as any).renameDialog.callback, close: this.closeDialogs}))
      } else if ((this.state as any).importDialog) {
        return (ImportTabbedDialog({client: (this.props as any).client, dialog: (this.state as any).importDialog, close: this.closeDialogs}))
      } else if ((this.state as any).shareDialog) {
        return (ShareDialog({client: (this.props as any).client, enableLaraSharing: (this.props as any).enableLaraSharing, close: this.closeDialogs, settings: ((this.props as any).ui != null ? (this.props as any).ui.shareDialog : undefined) || {}}))
      }
    })(),

      // alert and confirm dialogs can be overlayed on other dialogs
      (this.state as any).alertDialog ?
        (AlertDialog({title: (this.state as any).alertDialog.title, message: (this.state as any).alertDialog.message, callback: (this.state as any).alertDialog.callback, close: this.closeAlert})) : undefined,
      (this.state as any).confirmDialog ?
        (ConfirmDialog(_.merge({}, (this.state as any).confirmDialog, { close: this.closeConfirm }))) : undefined
    ))
  }

  render() {
    const menuItems = !(this.props as any).hideMenuBar ? (this.state as any).menuItems : []
    if ((this.props as any).appOrMenuElemId) {
      // CSS class depends on whether we're in app (iframe) or view (menubar-only) mode
      return (div({className: (this.props as any).usingIframe ? 'app' : 'view' },
        (MenuBar({client: (this.props as any).client, filename: (this.state as any).filename, provider: (this.state as any).provider, fileStatus: (this.state as any).fileStatus, items: menuItems, options: (this.state as any).menuOptions})),
        // only render the wrapped client app in app (iframe) mode
        (this.props as any).usingIframe ?
          (InnerApp({app: (this.props as any).app})) : undefined,
        this.renderDialogs()
      ))
    } else if ((this.state as any).providerDialog || (this.state as any).downloadDialog) {
      return (div({className: 'app'},
        this.renderDialogs()
      ))
    } else {
      return null
    }
  }
}

export default AppView
