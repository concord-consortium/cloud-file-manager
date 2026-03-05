import _ from "lodash"
import React from "react"
import ReactDOMFactories from "react-dom-factories"
import { createReactFactory, createReactClassFactory } from "../create-react-factory"
import menuBarView from './menu-bar-view'
import providerTabbedDialogView from './provider-tabbed-dialog-view'
import downloadDialogView from './download-dialog-view'
import renameDialogView from './rename-dialog-view'
import ShareDialogView from './share-dialog-view'
import blockingModalView from './blocking-modal-view'
import alterDialogView from './alert-dialog-view'
import confirmDialogView from './confirm-dialog-view'
import importTabbedDialogView from './import-tabbed-dialog-view'
import selectInteractiveStateDialog from './select-interactive-state-dialog-view'

const MenuBar = createReactFactory(menuBarView)
const ProviderTabbedDialog = createReactFactory(providerTabbedDialogView)
const DownloadDialog = createReactFactory(downloadDialogView)
const RenameDialog = createReactFactory(renameDialogView)
const BlockingModal = createReactFactory(blockingModalView)
const AlertDialog = createReactFactory(alterDialogView)
const ConfirmDialog = createReactFactory(confirmDialogView)
const ImportTabbedDialog = createReactFactory(importTabbedDialogView)
const SelectInteractiveStateDialog = createReactFactory(selectInteractiveStateDialog)

import tr from '../utils/translate'
import isString from '../utils/is-string'
import { CloudMetadata } from "../providers/provider-interface"
import { CFMMenuBarOptions, CFMMenuItem, CFMShareDialogSettings, CFMUIOptions } from "../app-options"
import { CloudFileManagerClient, CloudFileManagerClientEvent } from "../client"
import { CloudFileManagerUIEvent } from "../ui"
import { SelectInteractiveStateDialogProps } from "./select-interactive-state-dialog-view"

const {div, iframe} = ReactDOMFactories

const InnerApp = createReactClassFactory({

  displayName: 'CloudFileManagerInnerApp',

  shouldComponentUpdate(nextProps: any) {
    return nextProps.app !== this.props.app
  },

  render() {
    return (div({className: 'innerApp'},
      (iframe({src: this.props.app, allow: this.props.iframeAllow}))
    ))
  }
})

interface IAppViewProps {
  client?: CloudFileManagerClient
  ui?: CFMUIOptions
  appOrMenuElemId?: string
  hideMenuBar?: boolean
  enableLaraSharing?: boolean
  usingIframe?: boolean
  app?: string   // src url for <iframe>
  iframeAllow?: string
}

interface IAppViewState {
  filename: string | null
  provider?: any
  menuItems: CFMMenuItem[]
  menuOptions: CFMMenuBarOptions
  providerDialog: null | Record<string, any>
  downloadDialog: null | Record<string, any>
  renameDialog: null | Record<string, any>
  shareDialog: null | CFMShareDialogSettings
  blockingModalProps: null | Record<string, any>
  alertDialog: null | Record<string, any>
  confirmDialog: null | Record<string, any>
  importDialog: null | Record<string, any>
  selectInteractiveStateDialog: null | SelectInteractiveStateDialogProps
  fileStatus?: { message: string, type: string }
  dirty: boolean
}

class AppView extends React.Component<IAppViewProps, IAppViewState> {
  displayName: string
  state: IAppViewState

  constructor(props: IAppViewProps) {
    super(props)
    this.displayName = 'CloudFileManager'
    const client = this.props.client
    this.state = {
      filename: this.getFilename(client?.state.metadata),
      provider: client?.state.metadata?.provider,
      menuItems: client?._ui.menu?.items || [],
      menuOptions: this.props.ui?.menuBar || {},
      providerDialog: null,
      downloadDialog: null,
      renameDialog: null,
      shareDialog: null,
      blockingModalProps: null,
      alertDialog: null,
      confirmDialog: null,
      importDialog: null,
      selectInteractiveStateDialog: null,
      dirty: false
    }
  }

  getFilename(metadata?: CloudMetadata) {
    return metadata?.name || null
  }

  getFileStatus(event: CloudFileManagerClientEvent): { message: string, type: string } | undefined {
    if (event.state.saving) {
      return {message: tr('~FILE_STATUS.SAVING'), type: 'saving-info'}
    } else if (event.state.saved) {
      const providerName = event.state.metadata?.provider?.displayName
      const message = providerName
        ? tr('~FILE_STATUS.SAVED_TO_PROVIDER', { providerName })
        : tr('~FILE_STATUS.SAVED')
      return {message, type: 'info'}
    } else if (event.state.failures) {
      return {message: tr('~FILE_STATUS.FAILURE'), type: 'alert'}
    } else if (event.state.dirty) {
      return {message: tr('~FILE_STATUS.UNSAVED'), type: 'alert'}
    }
    return undefined
  }

  handleUIEvent(event: CloudFileManagerUIEvent) {
    const { client } = this.props
    if (!client) return

    const { menuOptions } = this.state
    switch (event.type) {
      case 'showProviderDialog':
        this.setState({providerDialog: event.data})
        break
      case 'showDownloadDialog':
        this.setState({downloadDialog: event.data})
        break
      case 'showRenameDialog':
        this.setState({renameDialog: event.data})
        break
      case 'showImportDialog':
        this.setState({importDialog: event.data})
        break
      case 'showShareDialog':
        this.setState({shareDialog: event.data})
        break
      case 'showBlockingModal':
        this.setState({blockingModalProps: event.data})
        break
      case 'hideBlockingModal':
        this.setState({blockingModalProps: null})
        break
      case 'showAlertDialog':
        this.setState({alertDialog: event.data})
        break
      case 'hideAlertDialog':
        this.setState({alertDialog: null})
        break
      case 'showConfirmDialog':
        this.setState({confirmDialog: event.data})
        break
      case 'showSelectInteractiveStateDialog':
        this.setState({selectInteractiveStateDialog: event.data})
        break
      case 'replaceMenu':
        this.setState({ menuItems: client._ui.menu?.items || [] })
        break
      case 'appendMenuItem':
        this.state.menuItems.push(event.data)
        this.setState({menuItems: this.state.menuItems})
        break
      case 'prependMenuItem':
        this.state.menuItems.unshift(event.data)
        this.setState({menuItems: this.state.menuItems})
        break
      case 'replaceMenuItem': {
        const index = this._getMenuItemIndex(event.data.key)
        if (index !== -1) {
          const {menuItems} = this.state
          menuItems[index] = event.data.item
          this.setState({menuItems})
        }
        break
      }
      case 'insertMenuItemBefore': {
        const index = this._getMenuItemIndex(event.data.key)
        if (index !== -1) {
          if (index === 0) {
            this.state.menuItems.unshift(event.data.item)
          } else {
            this.state.menuItems.splice(index, 0, event.data.item)
          }
          this.setState({menuItems: this.state.menuItems})
        }
        break
      }
      case 'insertMenuItemAfter': {
        const index = this._getMenuItemIndex(event.data.key)
        if (index !== -1) {
          if (index === (this.state.menuItems.length - 1)) {
            this.state.menuItems.push(event.data.item)
          } else {
            this.state.menuItems.splice(index + 1, 0, event.data.item)
          }
          this.setState({menuItems: this.state.menuItems})
        }
        break
      }
      case 'setMenuBarInfo':
        menuOptions.info = event.data
        this.setState({menuOptions})
        break
      case 'updateMenuBar':
        this.setState({ menuOptions: { ...menuOptions, ...event.data } })
        break
    }
  }

  componentDidMount() {
    const { client } = this.props
    if (!client) return

    client.listen((event: CloudFileManagerClientEvent) => {
      const fileStatus = this.getFileStatus(event)
      this.setState({
        filename: this.getFilename(event.state.metadata),
        provider: event.state.metadata?.provider,
        fileStatus
      })

      if (event.type === 'connected') {
        this.setState({menuItems: client._ui.menu?.items || []})
      }
    })

    client._ui.listen((event: CloudFileManagerUIEvent) => {
      this.handleUIEvent(event)
    })

    client._ui.resolveIsInitialized(true)
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
    this.setState({
      providerDialog: null,
      downloadDialog: null,
      renameDialog: null,
      shareDialog: null,
      importDialog: null,
      selectInteractiveStateDialog: null
    })
  }

  closeAlert = () => {
    this.setState({alertDialog: null})
  }

  closeConfirm = () => {
    this.setState({confirmDialog: null})
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
        const { client, enableLaraSharing, ui } = this.props
        if (!client) return null
        return (
          <ShareDialogView currentBaseUrl={client.getCurrentUrl()} isShared={client.isShared()}
            sharedDocumentId={client.state?.currentContent?.get('sharedDocumentId')}
            sharedDocumentUrl={client.state?.currentContent?.get('sharedDocumentUrl')}
            settings={ui?.shareDialog || {}}
            enableLaraSharing={enableLaraSharing}
            onAlert={(message: string, title?: string) => client.alert(message, title)}
            onToggleShare={(callback: (err: string | null, sharedContentId?: string) => void) => client.toggleShare(callback)}
            onUpdateShare={() => client.shareUpdate()}
            close={this.closeDialogs} />
        )
      } else if (this.state.selectInteractiveStateDialog) {
        return <SelectInteractiveStateDialog {...this.state.selectInteractiveStateDialog} close={this.closeDialogs} />
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
          (InnerApp({app: this.props.app, iframeAllow: this.props.iframeAllow})) : undefined,
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
