import queryString from 'query-string'
import { cloneDeep } from 'lodash'
import React from 'react'
import { CFMLaraProviderOptions, CFMLaraProviderLogData } from '../app-options'
import { CloudFileManagerClient } from '../client'
import {
  cloudContentFactory, CloudMetadata, ECapabilities, ProviderInterface,
  ProviderLoadCallback, ProviderOpenCallback, ProviderSaveCallback
}  from './provider-interface'
import {
  getInitInteractiveMessage, getInteractiveState as _getInteractiveState, IInitInteractive, IInteractiveStateProps,
  readAttachment, setInteractiveState as _setInteractiveState, writeAttachment
} from '@concord-consortium/lara-interactive-api'
import { SelectInteractiveStateDialogProps } from '../views/select-interactive-state-dialog-view'
const getInteractiveState = () => cloneDeep(_getInteractiveState())
const setInteractiveState = <InteractiveState>(newState: InteractiveState | null) =>
        _setInteractiveState(cloneDeep(newState))

interface InteractiveApiProviderParams {
  documentId?: string;
  interactiveState?: any;
}

// pass `interactiveApi=attachment` as url parameter to always save state as an attachment
export const kAttachmentUrlParameter = "attachment"

// pass `interactiveApi=dynamic` to save large documents as attachments
export const kDynamicAttachmentUrlParameter = "dynamic"
// can save it twice with room to spare in 1MB Firestore limit
const kDynamicAttachmentSizeThreshold = 480 * 1024

// in solidarity with legacy DocumentStore implementation and S3 sharing implementation
export const kAttachmentFilename = "file.json"

// when writing attachments, interactive state is just a reference to the attachment
interface InteractiveStateAttachment {
  __attachment__: typeof kAttachmentFilename,
  contentType?: "application/json" | "text/plain"
}
const interactiveStateAttachment =
(contentType?: InteractiveStateAttachment["contentType"]): InteractiveStateAttachment => {
  return { __attachment__: kAttachmentFilename, contentType }
}
const isInteractiveStateAttachment = (content: any) =>
        (typeof content === "object") && (content.__attachment__ === kAttachmentFilename)

// This provider supports LARA interactives that save/restore state via the LARA interactive API.
// To signal to the CFM that this provider should handle save/restore operations, add
// `interactiveApi` to the query params, e.g. `?interactiveApi` or `?interactiveApi=true`.
class InteractiveApiProvider extends ProviderInterface {
  static Name = 'interactiveApi'
  client: CloudFileManagerClient
  options: CFMLaraProviderOptions
  initInteractivePromise: Promise<IInitInteractive>
  readyPromise: Promise<boolean>

  constructor(options: CFMLaraProviderOptions, client: CloudFileManagerClient) {
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
            (this.initInteractivePromise = getInitInteractiveMessage() as Promise<IInitInteractive>)
  }

  isReady() {
    return this.readyPromise
  }

  shouldSaveAsAttachment(content: any) {
    const interactiveApi = queryString.parse(location.search).interactiveApi
    switch (interactiveApi) {
      case kAttachmentUrlParameter:
        return true
      case kDynamicAttachmentUrlParameter:
        return JSON.stringify(content).length >= kDynamicAttachmentSizeThreshold
    }
    return false
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

  async handleRunRemoteEndpoint(initInteractiveMessage: IInitInteractive) {
    if (initInteractiveMessage.mode !== "runtime") {
      return
    }

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

  async readAttachmentContent(interactiveState: InteractiveStateAttachment, interactiveId?: string) {
    const response = await readAttachment({name: interactiveState.__attachment__, interactiveId})
    if (response.ok) {
      // TODO: Scott suggests reading contentType from response rather than from interactiveState
      return interactiveState.contentType === "application/json" ? response.json() : response.text()
    }
    else {
      throw new Error(`Error reading attachment contents! ["${response.statusText}"]`)
    }
  }

  async processRawInteractiveState(interactiveState: any, interactiveId?: string) {
    return isInteractiveStateAttachment(interactiveState)
            ? await this.readAttachmentContent(interactiveState, interactiveId)
            : cloneDeep(interactiveState)
  }

  // the client uses a callback pattern, so wrap it in an async wrapper
  async selectFromInteractiveStates(props: SelectInteractiveStateDialogProps) {
    return new Promise<{}>((resolve, _reject) => {
      this.client.selectInteractiveStateDialog(props, (selected) => {
        resolve(selected)
      })
    })
  }

  async getInitialInteractiveStateAndinteractiveId(initInteractiveMessage: IInitInteractive): Promise<{interactiveState: {}, interactiveId?: string}> {
    if (initInteractiveMessage.mode === "authoring") {
      return null
    }
    if (initInteractiveMessage.mode === "report") {
      return {interactiveState: initInteractiveMessage.interactiveState}
    }

    let interactiveState = initInteractiveMessage.interactiveState
    let interactiveId = initInteractiveMessage.interactive.id

    const interactiveStateAvailable = !!interactiveState
    const {allLinkedStates} = initInteractiveMessage

    // this is adapted from the existing autolaunch.ts file
    if (allLinkedStates?.length > 0) {
      // find linked state which is directly linked to this one along with the most recent linked state.
      const directlyLinkedState = allLinkedStates[0]

      let mostRecentLinkedState: IInteractiveStateProps<{}>
      if (directlyLinkedState.updatedAt) {
        mostRecentLinkedState = allLinkedStates.slice().sort((a, b) => {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        })[0]
      } else {
        // currently the AP doesn't make the updatedAt attribute available so just pick the directly linked state
        mostRecentLinkedState = directlyLinkedState
      }

      const currentDataTimestamp = new Date(initInteractiveMessage.updatedAt || Date.now())
      const mostRecentLinkedStateTimestamp = new Date(mostRecentLinkedState.updatedAt || Date.now())
      const directlyLinkedStateTimestamp = new Date(directlyLinkedState.updatedAt ||  Date.now())

      // current state is available, but there's more recent data in one of the linked states. Ask user.
      if (interactiveStateAvailable && mostRecentLinkedStateTimestamp && mostRecentLinkedStateTimestamp > currentDataTimestamp) {
        interactiveState = await this.selectFromInteractiveStates({
          state1: mostRecentLinkedState,
          state2: initInteractiveMessage,
          interactiveStateAvailable
        })

        interactiveId = interactiveState === mostRecentLinkedState.interactiveState
          ? mostRecentLinkedState.interactive.id
          : initInteractiveMessage.interactive.id

        if (interactiveState === mostRecentLinkedState.interactiveState) {
          // remove existing interactive state, so the interactive will be initialized from the linked state next time (if it is not saved).
          setInteractiveState(null)
        } else {
          // update the current interactive state timestamp so the next reload doesn't trigger this picker UI
          setInteractiveState("touch")
        }

        return {interactiveState, interactiveId}
      }

      // there's no current state and directly linked interactive isn't the most recent one. Ask user.
      if (!interactiveStateAvailable &&
          directlyLinkedState !== mostRecentLinkedState &&
          directlyLinkedStateTimestamp && mostRecentLinkedStateTimestamp &&
          mostRecentLinkedStateTimestamp > directlyLinkedStateTimestamp) {
        interactiveState = await this.selectFromInteractiveStates({
          state1: mostRecentLinkedState,
          state2: directlyLinkedState,
          interactiveStateAvailable
        })

        interactiveId = interactiveState === mostRecentLinkedState.interactiveState
          ? mostRecentLinkedState.interactive.id
          : directlyLinkedState.interactive.id

          return {interactiveState, interactiveId}
      }

      // there's no current state, but the directly linked state is the most recent one.
      if (!interactiveStateAvailable && directlyLinkedState) {
        interactiveState = directlyLinkedState.interactiveState
        interactiveId = directlyLinkedState.interactive.id
      }
    }

    return {interactiveState, interactiveId}
  }

  getinteractiveId(initInteractiveMessage: IInitInteractive) {
    return initInteractiveMessage.mode === "runtime" ? initInteractiveMessage.interactive.id : undefined
  }

  async handleInitialInteractiveState(initInteractiveMessage: IInitInteractive) {
    let interactiveState: any

    const {interactiveState: initialInteractiveState, interactiveId} = await this.getInitialInteractiveStateAndinteractiveId(initInteractiveMessage)

    try {
      interactiveState = await this.processRawInteractiveState(initialInteractiveState, interactiveId)
    }
    catch(e) {
      // on initial interactive state there's not much we can do on error besides ignore it
    }
    const providerParams: InteractiveApiProviderParams = {
      // documentId is used to load initial state from shared document
      documentId: queryString.parse(location.search).documentId as string,
      // interactive state is used all other times; undefined => empty document
      interactiveState
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
    const initInteractiveMessage = await this.getInitInteractiveMessage()
    try {
      const interactiveId = this.getinteractiveId(initInteractiveMessage)
      const interactiveState = await this.processRawInteractiveState(await getInteractiveState(), interactiveId)
      // following the example of the LaraProvider, wrap the content in a CFM envelope
      const content = cloudContentFactory.createEnvelopedCloudContent(interactiveState)
      callback(null, content, metadata)
    }
    catch(e) {
      callback(e.message)
    }
  }

  async save(cloudContent: any, metadata: CloudMetadata, callback?: ProviderSaveCallback, disablePatch?: boolean) {
    await this.getInitInteractiveMessage()

    const clientContent = cloudContent.getContent()
    const contentType = typeof clientContent === 'string' ? 'text/plain' : 'application/json'
    if (this.shouldSaveAsAttachment(clientContent)) {
      const content = contentType === 'application/json' ? JSON.stringify(clientContent) : clientContent
      const response = await writeAttachment({ name: kAttachmentFilename, content, contentType })
      if (response.ok) {
        setInteractiveState(interactiveStateAttachment(contentType))
      }
      else {
        // if write failed, pass error to callback
        return callback(response.statusText)
      }
    }
    else {
      setInteractiveState(clientContent)
    }
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
    if (initialInteractiveState != null) {
      successCallback(initialInteractiveState)
    }
    // otherwise, load the initial state from its document id (url)
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
