import queryString from 'query-string'
import React from 'react'
import { CFMBaseProviderOptions } from '../app-options'
import { CloudFileManagerClient } from '../client'
import {
  cloudContentFactory, CloudMetadata, ECapabilities, ProviderInterface,
  ProviderLoadCallback, ProviderOpenCallback, ProviderSaveCallback
}  from './provider-interface'
import {
  getInitInteractiveMessage, getInteractiveState, setInteractiveState
} from "@concord-consortium/lara-interactive-api"

// This provider supports LARA interactives that save/restore state via the LARA interactive API.
// To signal to the CFM that this provider should handle save/restore operations, add
// `laraInteractive` to the query params, e.g. `?laraInteractive` or `?laraInteractive=true`.

class LaraInteractiveProvider extends ProviderInterface {
  static Name = 'laraInteractive'
  client: CloudFileManagerClient;
  options: CFMBaseProviderOptions;
  initInteractivePromise: Promise<unknown>

  constructor(options: CFMBaseProviderOptions, client: CloudFileManagerClient) {
    super({
      name: LaraInteractiveProvider.Name,
      capabilities: {
        save: true,
        resave: true,
        "export": false,
        load: true,
        list: false,
        remove: false,
        rename: false,
        close: false
      }
    })
    this.options = options
    this.client = client

    this.getInitInteractiveMessage()
  }

  getInitInteractiveMessage() {
    // can we pull run_remote_endpoint out of initInteractive message?
    return this.initInteractivePromise ?? (this.initInteractivePromise = getInitInteractiveMessage())
  }

  handleUrlParams() {
    const params = queryString.parse(location.hash)
    // can have a value or be null (present without a value)
    if (params.laraInteractive !== undefined) {
      this.client.openProviderFile(this.name)
      return true
    }
  }

  // don't show in provider open/save dialogs
  filterTabComponent(capability: ECapabilities, defaultComponent: React.Component): React.Component | null {
    return null
  }

  async load(metadata: CloudMetadata, callback: ProviderLoadCallback) {
    await this.getInitInteractiveMessage()
    const interactiveState = await getInteractiveState()
    // following the example of the LaraProvider, wrap the content in a CFM envelope
    const content = cloudContentFactory.createEnvelopedCloudContent(interactiveState)
    callback(null, content, metadata)
  }

  async save(cloudContent: any, metadata: CloudMetadata, callback?: ProviderSaveCallback, disablePatch?: boolean) {
    await this.getInitInteractiveMessage()
    setInteractiveState(cloudContent.getContent())
    callback?.(null)
  }

  canOpenSaved() { return true }

  openSaved(_openSavedParams: any, callback: ProviderOpenCallback) {
    // need to pull out run_remote_endpoint
    const metadata = new CloudMetadata({
      type: CloudMetadata.File,
      provider: this
    })
    this.load(metadata, callback)
  }
}

export default LaraInteractiveProvider

// onBeforeUnload -- does client have any mechanism for this?
// does CODAP dialog occur when embedded in iframe?
