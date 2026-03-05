import { CloudFileManagerClient } from './client'
import { CFMMenu, CFMMenuBarOptions, CFMMenuItem, CFMUIMenuOptions, CFMUIOptions } from './app-options'
import tr  from './utils/translate'
import isString  from './utils/is-string'
import { SelectInteractiveStateDialogProps } from './views/select-interactive-state-dialog-view'

class CloudFileManagerUIEvent {
  data: any
  type: string

  constructor(type: string, data?: any) {
    this.type = type
    this.data = data ?? {}
  }
}

class CloudFileManagerUIMenu {
  static DefaultMenu: CFMMenu = ['newFileDialog', 'openFileDialog', 'revertSubMenu', 'separator', 'save', 'createCopy', 'shareSubMenu', 'renameDialog']

  items: CFMMenuItem[]
  options: CFMUIMenuOptions

  constructor(options: CFMUIMenuOptions, client: CloudFileManagerClient) {
    this.options = options
    this.items = this.parseMenuItems(options.menu ?? [], client)
  }

  parseMenuItems(menuItems: CFMMenuItem[], client: CloudFileManagerClient) {
    const setAction = (action: string) => (client as any)[action]?.bind(client) || (() => client.alert(`No ${action} action is available in the client`))

    const setEnabled = function(action: string) {
      switch (action) {
        case 'revertSubMenu':
          // revert sub-menu state depends on presence of shareEditKey
          return () => (client.state.openedContent && client.state.metadata) || client.canEditShared()
        case 'revertToLastOpenedDialog':
          return () => client.state.openedContent && client.state.metadata
        case 'shareGetLink':
        case 'shareSubMenu':
          return () => client.state.shareProvider != null
        case 'revertToSharedDialog':
          // revert to shared menu item state depends on sharedDocumentId
          return () => client.isShared()
        case 'shareUpdate':
          // shareUpdate menu item state depends on presence of shareEditKey or readWrite accessKey
          return () => client.canEditShared()
        default:
          return true
      }
    }

    const getItems = (subMenuItems: CFMMenuItem[]) => {
      if (subMenuItems) {
        return this.parseMenuItems(subMenuItems, client)
      } else {
        return undefined
      }
    }

    const names: Record<string, string> = {
      newFileDialog: tr("~MENU.NEW"),
      openFileDialog: tr("~MENU.OPEN"),
      closeFileDialog: tr("~MENU.CLOSE"),
      revertToLastOpenedDialog: tr("~MENU.REVERT_TO_LAST_OPENED"),
      revertToSharedDialog: tr("~MENU.REVERT_TO_SHARED_VIEW"),
      save: tr("~MENU.SAVE"),
      saveFileAsDialog: tr("~MENU.SAVE_AS"),
      saveSecondaryFileAsDialog: tr("~MENU.EXPORT_AS"),
      createCopy: tr("~MENU.CREATE_COPY"),
      shareGetLink: tr("~MENU.SHARE_GET_LINK"),
      shareUpdate: tr("~MENU.SHARE_UPDATE"),
      downloadDialog: tr("~MENU.DOWNLOAD"),
      renameDialog: tr("~MENU.RENAME"),
      revertSubMenu: tr("~MENU.REVERT_TO"),
      shareSubMenu: tr("~MENU.SHARE")
    }

    const subMenus: Record<string, CFMMenuItem[]> = {
      revertSubMenu: ['revertToLastOpenedDialog', 'revertToSharedDialog'],
      shareSubMenu: ['shareGetLink', 'shareUpdate']
    }

    const items: CFMMenuItem[] = []
    for (let i = 0; i < menuItems.length; i++) {
      let menuItem
      const item = menuItems[i]
      if (item === 'separator') {
        menuItem = {
          key: `separator${i}`,
          separator: true
        }
      } else if (isString(item)) {
        menuItem = {
          key: item,
          name: this.options.menuNames?.[item] || names[item] || `Unknown item: ${item}`,
          enabled: setEnabled(item),
          items: getItems(subMenus[item]),
          action: setAction(item)
        }
      } else {
        menuItem = item
        // clients can pass in custom {name:..., action:...} menu items where the action can be a client function name or otherwise it is assumed action is a function
        if (isString(item.action)) {
          menuItem.key = item.action
          menuItem.enabled = setEnabled(item.action)
          menuItem.action = setAction(item.action)
        } else {
          if (!menuItem.enabled) { menuItem.enabled = true }
        }
        if (item.items) { menuItem.items = getItems(item.items) }
      }
      items.push(menuItem)
    }
    return items
  }
}

export type UIEventCallback = (...args: any) => void
export type UIEventListenerCallback = (event: CloudFileManagerUIEvent) => void

class CloudFileManagerUI {
  client: CloudFileManagerClient
  listenerCallbacks: UIEventListenerCallback[]
  menu: CloudFileManagerUIMenu | null
  // set up promise to be resolved when initialization is complete
  resolveIsInitialized!: (isInitialized: boolean) => void
  isInitialized = new Promise<boolean>((resolve, reject) => {
    this.resolveIsInitialized = resolve
  })

  constructor(client: CloudFileManagerClient) {
    this.client = client
    this.menu = null
    this.listenerCallbacks = []
  }

  init(options: CFMUIOptions) {
    options = options || {}
    // skip the menu if explicity set to null (meaning no menu)
    if (options.menu !== null) {
      if (typeof options.menu === 'undefined') {
        options.menu = CloudFileManagerUIMenu.DefaultMenu
      }
      this.menu = new CloudFileManagerUIMenu(options, this.client)
    }
  }

  // for React to listen for dialog changes
  listen(callback: UIEventListenerCallback) {
    this.listenerCallbacks.push(callback)
  }

  listenerCallback(evt: CloudFileManagerUIEvent) {
    // wait until listeners have been installed before calling them
    this.isInitialized.then(() => {
      this.listenerCallbacks.forEach((callback) => callback(evt))
    })
  }

  replaceMenu(options: CFMUIMenuOptions) {
    this.menu = new CloudFileManagerUIMenu(options, this.client)
    this.listenerCallback(new CloudFileManagerUIEvent('replaceMenu', options))
  }

  appendMenuItem(item: CFMMenuItem) {
    this.listenerCallback(new CloudFileManagerUIEvent('appendMenuItem', item))
  }

  prependMenuItem(item: CFMMenuItem) {
    this.listenerCallback(new CloudFileManagerUIEvent('prependMenuItem', item))
  }

  replaceMenuItem(key: string, item: CFMMenuItem) {
    this.listenerCallback(new CloudFileManagerUIEvent('replaceMenuItem', { key, item }))
  }

  insertMenuItemBefore(key: string, item: CFMMenuItem) {
    this.listenerCallback(new CloudFileManagerUIEvent('insertMenuItemBefore', { key, item }))
  }

  insertMenuItemAfter(key: string, item: CFMMenuItem) {
    this.listenerCallback(new CloudFileManagerUIEvent('insertMenuItemAfter', { key, item }))
  }

  setMenuBarInfo(info: string) {
    this.listenerCallback(new CloudFileManagerUIEvent('setMenuBarInfo', info))
  }

  updateMenuBar(bar: CFMMenuBarOptions) {
    this.listenerCallback(new CloudFileManagerUIEvent('updateMenuBar', bar))
  }

  saveFileDialog(callback: UIEventCallback) {
    this._showProviderDialog('saveFile', (tr('~DIALOG.SAVE')), callback)
  }

  saveFileAsDialog(callback: UIEventCallback) {
    this._showProviderDialog('saveFileAs', (tr('~DIALOG.SAVE_AS')), callback)
  }

  saveSecondaryFileAsDialog(data: any, callback: UIEventCallback) {
    this._showProviderDialog('saveSecondaryFileAs', (tr('~DIALOG.EXPORT_AS')), callback, data)
  }

  openFileDialog(callback: UIEventCallback) {
    this._showProviderDialog('openFile', (tr('~DIALOG.OPEN')), callback)
  }

  importDataDialog(callback: UIEventCallback) {
    this.listenerCallback(new CloudFileManagerUIEvent('showImportDialog', {callback}))
  }

  downloadDialog(filename: string, content: any, callback?: UIEventCallback) {
    this.listenerCallback(new CloudFileManagerUIEvent('showDownloadDialog', { filename, content, callback }))
  }

  renameDialog(filename: string, callback: UIEventCallback) {
    this.listenerCallback(new CloudFileManagerUIEvent('showRenameDialog', { filename, callback }))
  }

  shareDialog(client: CloudFileManagerClient, enableLaraSharing = false) {
    this.listenerCallback(new CloudFileManagerUIEvent('showShareDialog', { client, enableLaraSharing }))
  }

  showBlockingModal(modalProps: any) {
    this.listenerCallback(new CloudFileManagerUIEvent('showBlockingModal', modalProps))
  }

  hideBlockingModal() {
    this.listenerCallback(new CloudFileManagerUIEvent('hideBlockingModal'))
  }

  editInitialFilename() {
    this.listenerCallback(new CloudFileManagerUIEvent('editInitialFilename'))
  }

  alertDialog(message: string, title?: string, callback?: () => void) {
    this.listenerCallback(new CloudFileManagerUIEvent('showAlertDialog', { title, message, callback }))
  }

  hideAlertDialog() {
    this.listenerCallback(new CloudFileManagerUIEvent('hideAlertDialog'))
  }

  confirmDialog(params: any) {
    this.listenerCallback(new CloudFileManagerUIEvent('showConfirmDialog', params))
  }

  selectInteractiveStateDialog(props: SelectInteractiveStateDialogProps) {
    this.listenerCallback(new CloudFileManagerUIEvent('showSelectInteractiveStateDialog', props))
  }

  _showProviderDialog(action: string, title: string, callback: UIEventCallback, data?: any) {
    this.listenerCallback(new CloudFileManagerUIEvent('showProviderDialog', { action, title, callback, data }))
  }
}

export {
  CloudFileManagerUIEvent,
  CloudFileManagerUI,
  CloudFileManagerUIMenu
}
