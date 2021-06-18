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
import tr  from './utils/translate'
import isString  from './utils/is-string'

export type UIEventCallback = (...args: any) => void;

class CloudFileManagerUIEvent {
  data: any;
  type: any;

  constructor(type: any, data: any) {
    this.type = type
    if (data == null) { data = {} }
    this.data = data
  }
}

class CloudFileManagerUIMenu {
  DefaultMenu: any;
  items: any;
  options: any;

  static initClass() {
    (this as any).DefaultMenu = ['newFileDialog', 'openFileDialog', 'revertSubMenu', 'separator', 'save', 'createCopy', 'shareSubMenu', 'renameDialog']
  }

  constructor(options: any, client: any) {
    this.options = options
    this.items = this.parseMenuItems(options.menu, client)
  }

  // @ts-expect-error ts-migrate(7023) FIXME: 'parseMenuItems' implicitly has return type 'any' ... Remove this comment to see the full error message
  parseMenuItems(menuItems: any, client: any) {
    const setAction = (action: any) => (client[action] != null ? client[action].bind(client) : undefined) || (() => client.alert(`No ${action} action is available in the client`))

    const setEnabled = function(action: any) {
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

    // @ts-expect-error ts-migrate(7024) FIXME: Function implicitly has return type 'any' because ... Remove this comment to see the full error message
    const getItems = (subMenuItems: any) => {
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

    const subMenus: Record<string, string[]> = {
      revertSubMenu: ['revertToLastOpenedDialog', 'revertToSharedDialog'],
      shareSubMenu: ['shareGetLink', 'shareUpdate']
    }

    const items = []
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
          name: (this.options.menuNames != null ? this.options.menuNames[item] : undefined) || names[item] || `Unknown item: ${item}`,
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
CloudFileManagerUIMenu.initClass()

class CloudFileManagerUI {
  client: any;
  listenerCallbacks: any;
  menu: any;

  constructor(client: any){
    this.client = client
    this.menu = null
    this.listenerCallbacks = []
  }

  init(options: any) {
    options = options || {}
    // skip the menu if explicity set to null (meaning no menu)
    if (options.menu !== null) {
      if (typeof options.menu === 'undefined') {
        options.menu = (CloudFileManagerUIMenu as any).DefaultMenu
      }
      return this.menu = new CloudFileManagerUIMenu(options, this.client)
    }
  }

  // for React to listen for dialog changes
  listen(callback: any) {
    return this.listenerCallbacks.push(callback)
  }

  listenerCallback(evt: any) {
    // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
    return Array.from(this.listenerCallbacks).map((callback) => callback(evt))
  }

  appendMenuItem(item: any) {
    return this.listenerCallback(new CloudFileManagerUIEvent('appendMenuItem', item))
  }

  prependMenuItem(item: any) {
    return this.listenerCallback(new CloudFileManagerUIEvent('prependMenuItem', item))
  }

  replaceMenuItem(key: any, item: any) {
    return this.listenerCallback(new CloudFileManagerUIEvent('replaceMenuItem', { key, item }))
  }

  insertMenuItemBefore(key: any, item: any) {
    return this.listenerCallback(new CloudFileManagerUIEvent('insertMenuItemBefore', { key, item }))
  }

  insertMenuItemAfter(key: any, item: any) {
    return this.listenerCallback(new CloudFileManagerUIEvent('insertMenuItemAfter', { key, item }))
  }

  setMenuBarInfo(info: any) {
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

  downloadDialog(filename: any, content: any, callback: UIEventCallback) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showDownloadDialog', { filename, content, callback }))
  }

  renameDialog(filename: any, callback: UIEventCallback) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showRenameDialog', { filename, callback }))
  }

  shareDialog(client: any, enableLaraSharing = false) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showShareDialog', { client, enableLaraSharing }))
  }

  showBlockingModal(modalProps: any) {
    return this.listenerCallback(new CloudFileManagerUIEvent('showBlockingModal', modalProps))
  }

  hideBlockingModal() {
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
    return this.listenerCallback(new CloudFileManagerUIEvent('hideBlockingModal'))
  }

  editInitialFilename() {
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
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
