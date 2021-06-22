// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { CloudFileManagerClient } from './client'
import { CFMMenu, CFMMenuItem, CFMUIOptions } from './app-options'
import tr  from './utils/translate'
import isString  from './utils/is-string'

class CloudFileManagerUIEvent {
  data: any;
  type: string;

  constructor(type: string, data?: any) {
    this.type = type
    if (data == null) { data = {} }
    this.data = data
  }
}

class CloudFileManagerUIMenu {
  static DefaultMenu: CFMMenu = ['newFileDialog', 'openFileDialog', 'revertSubMenu', 'separator', 'save', 'createCopy', 'shareSubMenu', 'renameDialog'];

  items: CFMMenuItem[];
  options: CFMUIOptions;

  constructor(options: CFMUIOptions, client: CloudFileManagerClient) {
    this.options = options
    this.items = this.parseMenuItems(options.menu, client)
  }

  parseMenuItems(menuItems: CFMMenuItem[], client: CloudFileManagerClient) {
    const setAction = (action: string) => (client as any)[action]?.bind(client) || (() => client.alert(`No ${action} action is available in the client`))

    const setEnabled = function(action: string) {
      switch (action) {
        case 'revertSubMenu':
          // revert sub-menu state depends on presence of shareEditKey
          return () => ((client.state.openedContent != null) && (client.state.metadata != null)) || client.canEditShared()
        case 'revertToLastOpenedDialog':
          return () => (client.state.openedContent != null) && (client.state.metadata != null)
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
        return null
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
      var menuItem
      const item = menuItems[i]
      if (item === 'separator') {
        menuItem = {
          key: `seperator${i}`,
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

export type UIEventCallback = (...args: any) => void;
export type UIEventListenerCallback = (event: CloudFileManagerUIEvent) => void;

class CloudFileManagerUI {
  client: CloudFileManagerClient;
  listenerCallbacks: UIEventListenerCallback[];
  menu: CloudFileManagerUIMenu;

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
      return this.menu = new CloudFileManagerUIMenu(options, this.client)
    }
  }

  // for React to listen for dialog changes
  listen(callback: UIEventListenerCallback) {
    return this.listenerCallbacks.push(callback)
  }

  listenerCallback(evt: CloudFileManagerUIEvent) {
    return Array.from(this.listenerCallbacks).map((callback) => callback(evt))
  }

  appendMenuItem(item: CFMMenuItem) {
    return this.listenerCallback(new CloudFileManagerUIEvent('appendMenuItem', item))
  }

  prependMenuItem(item: CFMMenuItem) {
    return this.listenerCallback(new CloudFileManagerUIEvent('prependMenuItem', item))
  }

  replaceMenuItem(key: string, item: CFMMenuItem) {
    return this.listenerCallback(new CloudFileManagerUIEvent('replaceMenuItem', { key, item }))
  }

  insertMenuItemBefore(key: string, item: CFMMenuItem) {
    return this.listenerCallback(new CloudFileManagerUIEvent('insertMenuItemBefore', { key, item }))
  }

  insertMenuItemAfter(key: string, item: CFMMenuItem) {
    return this.listenerCallback(new CloudFileManagerUIEvent('insertMenuItemAfter', { key, item }))
  }

  setMenuBarInfo(info: string) {
    return this.listenerCallback(new CloudFileManagerUIEvent('setMenuBarInfo', info))
  }

  saveFileDialog(callback: UIEventCallback) {
    return this._showProviderDialog('saveFile', (tr('~DIALOG.SAVE')), callback)
  }

  saveFileAsDialog(callback: UIEventCallback) {
    return this._showProviderDialog('saveFileAs', (tr('~DIALOG.SAVE_AS')), callback)
  }

  saveSecondaryFileAsDialog(data: any, callback: UIEventCallback) {
    return this._showProviderDialog('saveSecondaryFileAs', (tr('~DIALOG.EXPORT_AS')), callback, data)
  }

  openFileDialog(callback: UIEventCallback) {
    return this._showProviderDialog('openFile', (tr('~DIALOG.OPEN')), callback)
  }

  importDataDialog(callback: UIEventCallback) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showImportDialog', {callback}))
  }

  downloadDialog(filename: string, content: any, callback: UIEventCallback) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showDownloadDialog', { filename, content, callback }))
  }

  renameDialog(filename: string, callback: UIEventCallback) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showRenameDialog', { filename, callback }))
  }

  shareDialog(client: CloudFileManagerClient, enableLaraSharing = false) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showShareDialog', { client, enableLaraSharing }))
  }

  showBlockingModal(modalProps: any) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showBlockingModal', modalProps))
  }

  hideBlockingModal() {
    return this.listenerCallback(new CloudFileManagerUIEvent('hideBlockingModal'))
  }

  editInitialFilename() {
    return this.listenerCallback(new CloudFileManagerUIEvent('editInitialFilename'))
  }

  alertDialog(message: string, title?: string, callback?: () => void) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showAlertDialog', { title, message, callback }))
  }

  confirmDialog(params: any) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showConfirmDialog', params))
  }

  _showProviderDialog(action: string, title: string, callback: UIEventCallback, data?: any) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showProviderDialog', { action, title, callback, data }))
  }
}

export {
  CloudFileManagerUIEvent,
  CloudFileManagerUI,
  CloudFileManagerUIMenu
}
