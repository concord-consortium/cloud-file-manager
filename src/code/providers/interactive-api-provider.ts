import queryString from 'query-string'
import React from 'react'
import { CFMInteractiveApiProviderOptions, CFMLaraProviderLogData } from '../app-options'
import { CloudFileManagerClient } from '../client'
import {
  cloudContentFactory, CloudMetadata, ECapabilities, ProviderInterface,
  ProviderLoadCallback, ProviderOpenCallback, ProviderSaveCallback
}  from './provider-interface'
import {
  getInitInteractiveMessage, getInteractiveState, IRuntimeInitInteractive, setInteractiveState
} from '@concord-consortium/lara-interactive-api'

interface InteractiveApiProviderParams {
  documentId?: string;
  interactiveState?: any;
}

// This provider supports LARA interactives that save/restore state via the LARA interactive API.
// To signal to the CFM that this provider should handle save/restore operations, add
// `interactiveApi` to the query params, e.g. `?interactiveApi` or `?interactiveApi=true`.
class InteractiveApiProvider extends ProviderInterface {
  static Name = 'interactiveApi'
  client: CloudFileManagerClient;
  options: CFMInteractiveApiProviderOptions;
  initInteractivePromise: Promise<IRuntimeInitInteractive>
  readyPromise: Promise<boolean>

  constructor(options: CFMInteractiveApiProviderOptions, client: CloudFileManagerClient) {
    super({
      name: InteractiveApiProvider.Name,
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

    this.handleInitInteractive()
  }

  getInitInteractiveMessage() {
    return this.initInteractivePromise ??
            (this.initInteractivePromise = getInitInteractiveMessage() as Promise<IRuntimeInitInteractive>)
  }

  isReady() {
    return this.readyPromise
  }

  logLaraData(interactiveStateUrl?: string, runRemoteEndpoint?: string) {
    if (runRemoteEndpoint) {
      const laraData: CFMLaraProviderLogData = {
        operation: 'open',
        runStateUrl: interactiveStateUrl,
        run_remote_endpoint: runRemoteEndpoint
      }
      // pass the LARA info (notably the run_remote_endpoint) to the CFM client
      this.options?.logLaraData?.(laraData)
    }
  }

  async handleRunRemoteEndpoint(initInteractiveMessage: IRuntimeInitInteractive) {
    // no point in tracking down the run_remote_endpoint if we can't notify the client
    if (!initInteractiveMessage || !this.options?.logLaraData) return

    if (initInteractiveMessage.runRemoteEndpoint) {
      this.logLaraData(initInteractiveMessage.interactiveStateUrl, initInteractiveMessage.runRemoteEndpoint)
    }
    // classInfoUrl is only available for students running while logged in
    else if (initInteractiveMessage.classInfoUrl && initInteractiveMessage.interactiveStateUrl) {
      // extract the run_remote_endpoint from the interactive run state
      // cf. LaraProvider's processInitialRunState() function
      try {
        const response = await fetch(initInteractiveMessage.interactiveStateUrl, { credentials: 'include' })
        if (response.ok) {
          const state = await response.json()
          this.logLaraData(initInteractiveMessage.interactiveStateUrl, state?.run_remote_endpoint)
        }
      }
      catch(e) {
        // ignore errors; if we can't get the state we don't have a runRemoteEndpoint
      }
    }
  }

  async handleInitialInteractiveState(initInteractiveMessage: IRuntimeInitInteractive) {
    const providerParams: InteractiveApiProviderParams = {
      // documentId is used to load initial state from shared document
      documentId: queryString.parse(location.search).documentId as string,
      // interactive state is used on subsequent visits
      interactiveState: initInteractiveMessage.interactiveState
    }
    this.client.openProviderFileWhenConnected(this.name, providerParams)
  }

  handleInitInteractive() {
    this.readyPromise = new Promise(resolve => {
      this.getInitInteractiveMessage().then(initInteractiveMessage => {
        Promise.all([
          this.handleRunRemoteEndpoint(initInteractiveMessage),
          this.handleInitialInteractiveState(initInteractiveMessage)
        ]).then (() => resolve(true))
      })
    })
  }

  handleUrlParams() {
    const params = queryString.parse(location.search)
    // can have a value or be null (present without a value)
    if (params.interactiveApi !== undefined) {
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
    setInteractiveState(cloudContent.getClientContent())
    callback?.(null)
  }

  canOpenSaved() { return true }

  getOpenSavedParams(metadata: CloudMetadata) {
    return metadata.providerData
  }

  async openSaved(openSavedParams: InteractiveApiProviderParams, callback: ProviderOpenCallback) {
    const { interactiveState: initialInteractiveState, ...otherParams } = openSavedParams

    // trigger appropriate CFM notifications
    const successCallback = (state: any) => {
      const content = cloudContentFactory.createEnvelopedCloudContent(state)
      const metadata = new CloudMetadata({
        type: CloudMetadata.File,
        provider: this,
        providerData: otherParams
      })
      callback(null, content, metadata)
    }

    // if we have an initial state, then use it
    if (initialInteractiveState) {
      successCallback(initialInteractiveState)
    }
    // otherwise, load the intial state from its document id (url)
    else if (openSavedParams.documentId) {
      try {
        const response = await fetch(openSavedParams.documentId)
        const interactiveState = response.ok ? await response.json() : undefined
        if (interactiveState) {
          // initialize our interactive state from the shared document contents
          setInteractiveState(interactiveState)
          // notify that we have new state
          successCallback(interactiveState)
        }
        return
      }
      catch(e) {
        // ignore errors
      }
      callback(`Unable to open saved document: ${openSavedParams.documentId}!`)
    }
    else {
      // in the absence of any provided content, initialize with an empty string
      setInteractiveState("")
      // notify that we have new state
      successCallback("")
    }
  }
}

export default InteractiveApiProvider

// onBeforeUnload -- does client have any mechanism for this?
// does CODAP dialog occur when embedded in iframe?
