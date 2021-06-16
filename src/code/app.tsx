import AppView from './views/app-view'
import React from 'react'
import { CloudFileManagerUIMenu } from './ui'
import { CloudFileManagerClient } from './client'

import getHashParam from './utils/get-hash-param'

import '../style/app.styl'

class CloudFileManager {
  DefaultMenu: any;
  appOptions: any;
  client: any;

  constructor(options: any) {
    // since the module exports an instance of the class we need to fake a class variable as an instance variable
    this.DefaultMenu = (CloudFileManagerUIMenu as any).DefaultMenu

    // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
    this.client = new CloudFileManagerClient()
    this.appOptions = {}
  }

  // usingIframe: if true, client app is wrapped in an iframe within the CFM-managed div
  // appOrMenuElemId: if appOrMenuElemId is passed and usingIframe is true, then the CFM
  //   presents its UI and the wrapped client app within the specified element. If
  //   appOrMenuElemId is set and usingIframe is false, then the CFM presents its menubar
  //   UI within the specified element, but there is no iframe or wrapped client app.
  init(appOptions: any) {
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
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'eventCallback' implicitly has an 'any' ... Remove this comment to see the full error message
  createFrame(appOptions: any, appElemId: any, eventCallback = null) {
    this.appOptions = appOptions
    this.appOptions.usingIframe = true
    this.appOptions.appOrMenuElemId = appElemId
    this.init(this.appOptions)
    this.client.listen(eventCallback)
    this._renderApp(document.getElementById(appElemId))
  }

  clientConnect(eventCallback: any) {
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

  _renderApp(anchor: any) {
    this.appOptions.client = this.client
    // @ts-expect-error ts-migrate(2686) FIXME: 'ReactDOM' refers to a UMD global, but the current... Remove this comment to see the full error message
    ReactDOM.render(<AppView {... this.appOptions} />, anchor)
    this.client.iframe = anchor.getElementsByTagName('iframe')[0]
    this.client.rendered()
  }
}

// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
const instance = new  CloudFileManager()
export default instance;
(global as any).CloudFileManager = instance
