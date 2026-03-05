import _ from "lodash"
import React from "react"
import MenuBar from './menu-bar-view'
import ProviderTabbedDialog from './provider-tabbed-dialog-view'
import DownloadDialog from './download-dialog-view'
import RenameDialog from './rename-dialog-view'
import ShareDialogView from './share-dialog-view'
import BlockingModal from './blocking-modal-view'
import AlertDialog from './alert-dialog-view'
import ConfirmDialog from './confirm-dialog-view'
import ImportTabbedDialog from './import-tabbed-dialog-view'
import SelectInteractiveStateDialog from './select-interactive-state-dialog-view'

import tr from '../utils/translate'
import isString from '../utils/is-string'
import { CloudMetadata } from "../providers/provider-interface"
import { CFMMenuBarOptions, CFMMenuItem, CFMShareDialogSettings, CFMUIOptions } from "../app-options"
import { CloudFileManagerClient, CloudFileManagerClientEvent } from "../client"
import { CloudFileManagerUIEvent } from "../ui"
import { SelectInteractiveStateDialogProps } from "./select-interactive-state-dialog-view"

interface InnerAppProps {
  app?: string
  iframeAllow?: string
}

const InnerApp: React.FC<InnerAppProps> = React.memo(({ app, iframeAllow }) => {
  return (
    <div className="innerApp">
      <iframe src={app} allow={iframeAllow} />
    </div>
  )
})
InnerApp.displayName = 'CloudFileManagerInnerApp'

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
    const { client, enableLaraSharing, ui } = this.props
    const {
      blockingModalProps,
      providerDialog,
      downloadDialog,
      renameDialog,
      importDialog,
      shareDialog,
      selectInteractiveStateDialog,
      alertDialog,
      confirmDialog
    } = this.state

    let mainDialog: React.ReactNode = null

    if (blockingModalProps) {
      mainDialog = <BlockingModal {...blockingModalProps} />
    } else if (providerDialog) {
      mainDialog = <ProviderTabbedDialog client={client as any} dialog={providerDialog as any} close={this.closeDialogs} />
    } else if (downloadDialog) {
      mainDialog = (
        <DownloadDialog
          client={client as any}
          filename={downloadDialog.filename}
          content={downloadDialog.content}
          close={this.closeDialogs}
        />
      )
    } else if (renameDialog) {
      mainDialog = (
        <RenameDialog
          filename={renameDialog.filename}
          callback={renameDialog.callback}
          close={this.closeDialogs}
        />
      )
    } else if (importDialog) {
      mainDialog = <ImportTabbedDialog client={client as any} dialog={importDialog} close={this.closeDialogs} />
    } else if (shareDialog && client) {
      mainDialog = (
        <ShareDialogView
          currentBaseUrl={client.getCurrentUrl()}
          isShared={client.isShared()}
          sharedDocumentId={client.state?.currentContent?.get('sharedDocumentId')}
          sharedDocumentUrl={client.state?.currentContent?.get('sharedDocumentUrl')}
          settings={ui?.shareDialog || {}}
          enableLaraSharing={enableLaraSharing}
          onAlert={(message: string, title?: string) => client.alert(message, title)}
          onToggleShare={(callback: (err: string | null, sharedContentId?: string) => void) => client.toggleShare(callback)}
          onUpdateShare={() => client.shareUpdate()}
          close={this.closeDialogs}
        />
      )
    } else if (selectInteractiveStateDialog) {
      mainDialog = <SelectInteractiveStateDialog {...selectInteractiveStateDialog} close={this.closeDialogs} />
    }

    return (
      <div>
        {mainDialog}
        {/* alert and confirm dialogs can be overlayed on other dialogs */}
        {alertDialog && (
          <AlertDialog
            title={alertDialog.title}
            message={alertDialog.message}
            callback={alertDialog.callback}
            close={this.closeAlert}
          />
        )}
        {confirmDialog && (
          <ConfirmDialog {...(_.merge({}, confirmDialog, { close: this.closeConfirm }) as any)} />
        )}
      </div>
    )
  }

  render() {
    const { client, appOrMenuElemId, usingIframe, app, iframeAllow, hideMenuBar } = this.props
    const { filename, provider, fileStatus, menuItems, menuOptions, providerDialog, downloadDialog } = this.state

    const items = !hideMenuBar ? menuItems : []

    if (appOrMenuElemId) {
      // CSS class depends on whether we're in app (iframe) or view (menubar-only) mode
      return (
        <div className={usingIframe ? 'app' : 'view'}>
          <MenuBar
            client={client as any}
            filename={filename ?? undefined}
            provider={provider}
            fileStatus={fileStatus}
            items={items as any}
            options={menuOptions as any}
          />
          {/* only render the wrapped client app in app (iframe) mode */}
          {usingIframe && <InnerApp app={app} iframeAllow={iframeAllow} />}
          {this.renderDialogs()}
        </div>
      )
    } else if (providerDialog || downloadDialog) {
      return (
        <div className="app">
          {this.renderDialogs()}
        </div>
      )
    } else {
      return null
    }
  }
}

export default AppView
