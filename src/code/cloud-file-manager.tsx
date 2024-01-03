import React from 'react'
import ReactDOM from 'react-dom'
import AppView from './views/app-view'
import { CFMAppOptions, CFMMenu } from './app-options'
import { CloudFileManagerUIMenu } from './ui'
import { ClientEventCallback, CloudFileManagerClient } from './client'

import getHashParam from './utils/get-hash-param'

interface CFMAppRuntimeOptions extends CFMAppOptions {
  client?: CloudFileManagerClient;
}

export class CloudFileManager {
  DefaultMenu: CFMMenu
  appOptions: CFMAppRuntimeOptions
  client: CloudFileManagerClient

  constructor() {
    // since the module exports an instance of the class we need to fake a class variable as an instance variable
    this.DefaultMenu = CloudFileManagerUIMenu.DefaultMenu

    this.client = new CloudFileManagerClient()
    this.appOptions = {}
  }

  // usingIframe: if true, client app is wrapped in an iframe within the CFM-managed div
  // appOrMenuElemId: if appOrMenuElemId is passed and usingIframe is true, then the CFM
  //   presents its UI and the wrapped client app within the specified element. If
  //   appOrMenuElemId is set and usingIframe is false, then the CFM presents its menubar
  //   UI within the specified element, but there is no iframe or wrapped client app.
  init(appOptions: CFMAppOptions) {
    this.appOptions = appOptions
    this.appOptions.hashParams = {
      sharedContentId: getHashParam("shared"),
      fileParams: getHashParam("file"),
      copyParams: getHashParam("copy"),
      newInFolderParams: getHashParam("newInFolder")
    }

    this.client.setAppOptions(this.appOptions)
  }

  // Convenience function for setting up CFM with an iframe-wrapped client app
  createFrame(appOptions: CFMAppOptions, appElemId: string, eventCallback?: ClientEventCallback) {
    this.appOptions = appOptions
    this.appOptions.usingIframe = true
    this.appOptions.appOrMenuElemId = appElemId
    this.init(this.appOptions)
    this.client.listen(eventCallback)
    this._renderApp(document.getElementById(appElemId))
  }

  clientConnect(eventCallback: ClientEventCallback) {
    try {
      if (this.appOptions.appOrMenuElemId != null) {
        this._renderApp(document.getElementById(this.appOptions.appOrMenuElemId))
      } else {
        this._createHiddenApp()
      }
    } catch (e) {
      console.error(`Unable render app: ${e}`)
    }
    this.client.listen(eventCallback)
    this.client.connect()

    // open any initial document (if any specified) and signal ready()
    this.client.processUrlParams()

    // if iframed let the parent know about the connect
    if (window.parent !== window) {
      window.parent.postMessage({type: "cfm::iframedClientConnected"}, "*")
    }
  }

  _createHiddenApp() {
    const anchor = document.createElement("div")
    document.body.appendChild(anchor)
    this._renderApp(anchor)
  }

  _renderApp(anchor: HTMLElement) {
    this.appOptions.client = this.client
    ReactDOM.render(<AppView {... this.appOptions} />, anchor)
    this.client.iframe = anchor.getElementsByTagName('iframe')[0]
    this.client.rendered()
  }
}
