import { IRuntimeInitInteractive } from "@concord-consortium/lara-interactive-api"
import { CloudFileManagerClient } from "../client"
import InteractiveApiProvider, { kAttachmentFilename, kAttachmentUrlParameter, kDynamicAttachmentSizeThreshold, shouldSaveAsAttachment } from "./interactive-api-provider"
import { CloudContent, CloudMetadata, ECapabilities } from "./provider-interface"

jest.mock('@concord-consortium/lara-interactive-api')
const mockApi = require('@concord-consortium/lara-interactive-api')

describe('InteractiveApiProvider', () => {
  const originalLocation = window.location

  const mockWindowLocation = (newLocation: Location | URL) => {
    delete window.location
    window.location = newLocation as Location
  }

  const setLocation = (url: string) => {
    mockWindowLocation(new URL(url))
  }

  const setQueryParams = (params: string) => {
    setLocation(`https://concord.org${params ? '?' : ''}${params || ""}`)
  }

  const globalFetch = global.fetch
  const mockFetch = jest.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    global.fetch = mockFetch

    mockApi.getInitInteractiveMessage.mockReset()
    mockApi.getInteractiveState.mockReset()
    mockApi.setInteractiveState.mockReset()
    mockApi.readAttachment.mockReset()
    mockApi.writeAttachment.mockReset()
  })

  afterEach(() => {
    global.fetch = globalFetch
    mockWindowLocation(originalLocation)
  })

  const wasCalledWithEventOfType = (fn: jest.Mock, type: string) => {
    return fn.mock.calls.some(args => args[0].type === type)
  }

  const getMockedCall = (fn: jest.Mock, type: string) => {
    return fn.mock.calls
      .find((c: any) => c[0].type === type)
      .map((c: any) => c)[0]
  }

  it('should prevent calling client api functions until initInteractiveMessage has been received', done => {
    // getInitInteractiveMessage returns a promise that never resolves
    mockApi.getInitInteractiveMessage.mockImplementation(() => new Promise(() => {}))

    const client = new CloudFileManagerClient()
    const content = new CloudContent('fooContent', { isCfmWrapped: false, isPreCfmFormat: false })
    const metadata = new CloudMetadata({ name: 'foo' })
    const provider = new InteractiveApiProvider(undefined, client)
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(0)

    // should "inherit" static hasValidOptions() method
    expect(InteractiveApiProvider.hasValidOptions({})).toBe(true)

    setQueryParams("")
    expect(provider.handleUrlParams()).toBeFalsy()
    setQueryParams("interactiveApi")
    expect(provider.handleUrlParams()).toBe(true)

    const saveCallback = jest.fn()
    provider.save(content, metadata, saveCallback)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(0)

    const loadCallback = jest.fn()
    provider.load(metadata, loadCallback)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(0)

    expect(provider.filterTabComponent(ECapabilities.save, {} as any)).toBeNull()

    setTimeout(() => {
      // verify that we don't make api calls before initInteractive promise resolves
      expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
      expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
      expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(0)
      expect.assertions(17)
      done()
    }, 100)
  })

  it('should call client api functions as needed once initInteractiveMessage has been received', async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInteractiveStateUrl = 'https://concord.org/interactiveStateUrl'
    const mockRemoteEndpoint = 'remote-endpoint-12345'
    const mockInteractiveStateContents = {
      run_remote_endpoint: mockRemoteEndpoint
    }
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      interactiveStateUrl: mockInteractiveStateUrl,
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    // fetch response includes run_remote_endpoint
    mockFetch.mockImplementation(() => ({ ok: true, json: () => Promise.resolve(mockInteractiveStateContents) }))

    const mockLogLaraData = jest.fn()

    const client = new CloudFileManagerClient()
    const content = new CloudContent('fooContent', { isCfmWrapped: false, isPreCfmFormat: false })
    const metadata = new CloudMetadata({ name: 'foo' })
    const provider = new InteractiveApiProvider({ logLaraData: mockLogLaraData }, client)
    await provider.isReady()
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockLogLaraData).toHaveBeenCalledTimes(1)
    // client-provided logLaraData should be called with run_remote_endpoint
    expect(mockLogLaraData.mock.calls[0][0].run_remote_endpoint).toBe(mockRemoteEndpoint)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(0)

    // save with a callback
    const saveCallback = jest.fn()
    await provider.save(content, metadata, saveCallback)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(1)
    expect(saveCallback).toHaveBeenCalled()
    expect(saveCallback.mock.calls[0][0]).toBeNull()

    // save without a callback
    await provider.save(content, metadata)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(2)

    const loadCallback = jest.fn()
    await provider.load(metadata, loadCallback)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(1)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(2)
  })

  it('should use runRemoteEndpoint in initInteractive message if available', async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInteractiveStateUrl = 'https://concord.org/interactiveStateUrl'
    const mockRemoteEndpoint = 'remote-endpoint-12345'
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      // initInteractiveMessage contains runRemoteEndpoint
      runRemoteEndpoint: mockRemoteEndpoint,
      interactiveStateUrl: mockInteractiveStateUrl,
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    // fetch response does not include run_remote_endpoint
    mockFetch.mockImplementation(() => ({ ok: true, json: () => Promise.resolve("foo") }))

    const mockLogLaraData = jest.fn()

    const client = new CloudFileManagerClient()
    const provider = new InteractiveApiProvider({ logLaraData: mockLogLaraData }, client)
    await provider.isReady()
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockLogLaraData).toHaveBeenCalledTimes(1)
    // client-provided logLaraData should be called with run_remote_endpoint
    expect(mockLogLaraData.mock.calls[0][0].run_remote_endpoint).toBe(mockRemoteEndpoint)
    expect(mockApi.getInteractiveState).not.toHaveBeenCalled()
    expect(mockApi.setInteractiveState).not.toHaveBeenCalled()
  })

  it('should not call logLaraData if no runRemoteEndpoint is available', async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInteractiveStateUrl = 'https://concord.org/interactiveStateUrl'
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      interactiveStateUrl: mockInteractiveStateUrl,
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    // fetch response does not include run_remote_endpoint
    mockFetch.mockImplementation(() => ({ ok: true, json: () => Promise.resolve("foo") }))

    const mockLogLaraData = jest.fn()

    const client = new CloudFileManagerClient()
    const provider = new InteractiveApiProvider({ logLaraData: mockLogLaraData }, client)
    await provider.isReady()
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockLogLaraData).not.toHaveBeenCalled()
    expect(mockApi.getInteractiveState).not.toHaveBeenCalled()
    expect(mockApi.setInteractiveState).not.toHaveBeenCalled()
  })

  it("should signal an error if invalid parameters are provided", async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    const client = new CloudFileManagerClient()
    client.connect()
    const provider = new InteractiveApiProvider({}, client)
    await provider.isReady()

    // if no content provided, default content to the empty string
    const mockOpenSavedCallback = jest.fn()
    await provider.openSaved({}, mockOpenSavedCallback)
    expect(mockOpenSavedCallback.mock.calls[0][0]).toBeNull()
    expect(mockOpenSavedCallback.mock.calls[0][1].content.content).toBe("")

    // should call callback with error if fetch throws an exception (e.g. network failure)
    setQueryParams("documentId=https://initial/state")
    mockFetch.mockImplementation(() => { throw new Error("Error!") })
    provider.openSaved({ documentId: "https://initial/state" }, mockOpenSavedCallback)
    expect(typeof mockOpenSavedCallback.mock.calls[1][0]).toBe("string")
  })

  it("uses initial state if provided", async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      interactiveState: "foo",
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    // fetch response is initial interactive state
    setQueryParams("documentId=https://initial/state")
    mockFetch.mockImplementation(() => ({ ok: true }))

    const client = new CloudFileManagerClient()
    client.setAppOptions({ providers: ['interactiveApi'] })
    client.connect()
    const clientListener = jest.fn()
    client.listen(clientListener)
    const provider = client.providers[InteractiveApiProvider.Name] as InteractiveApiProvider
    await provider.isReady()
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(wasCalledWithEventOfType(clientListener, 'willOpenFile')).toBe(true)
    expect(wasCalledWithEventOfType(clientListener, 'openedFile')).toBe(true)
    expect(getMockedCall(clientListener, "openedFile").data.content).toEqual("foo")
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockApi.getInteractiveState).not.toHaveBeenCalled()
    expect(mockApi.setInteractiveState).not.toHaveBeenCalled()
  })

  it("uses linked state if provided and there is no interactive state", async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      interactiveState: null,
      hasLinkedInteractive: true,
      allLinkedStates: [{
        interactiveState: {foo: "test"},
        interactive: {
          id: "mw_interactive_101",
          name: ""
        }
      }],
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    // fetch response is initial interactive state
    setQueryParams("documentId=https://initial/state")
    mockFetch.mockImplementation(() => ({ ok: true }))

    const client = new CloudFileManagerClient()
    client.setAppOptions({ providers: ['interactiveApi'] })
    client.connect()
    const clientListener = jest.fn()
    client.listen(clientListener)
    const provider = client.providers[InteractiveApiProvider.Name] as InteractiveApiProvider
    await provider.isReady()
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(wasCalledWithEventOfType(clientListener, 'willOpenFile')).toBe(true)
    expect(wasCalledWithEventOfType(clientListener, 'openedFile')).toBe(true)
    expect(getMockedCall(clientListener, "openedFile").data.content).toEqual({foo: "test"})
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockApi.getInteractiveState).not.toHaveBeenCalled()
    expect(mockApi.setInteractiveState).not.toHaveBeenCalled()
  })

  it("uses interactive state if interactive state and linked state is provided", async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      interactiveState: {bar: "test"},
      hasLinkedInteractive: true,
      allLinkedStates: [{
        interactiveState: {foo: "test"},
        interactive: {
          id: "mw_interactive_101",
          name: ""
        }
      }],
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    // fetch response is initial interactive state
    setQueryParams("documentId=https://initial/state")
    mockFetch.mockImplementation(() => ({ ok: true }))

    const client = new CloudFileManagerClient()
    client.setAppOptions({ providers: ['interactiveApi'] })
    client.connect()
    const clientListener = jest.fn()
    client.listen(clientListener)
    const provider = client.providers[InteractiveApiProvider.Name] as InteractiveApiProvider
    await provider.isReady()
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(wasCalledWithEventOfType(clientListener, 'willOpenFile')).toBe(true)
    expect(wasCalledWithEventOfType(clientListener, 'openedFile')).toBe(true)
    expect(getMockedCall(clientListener, "openedFile").data.content).toEqual({bar: "test"})
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockApi.getInteractiveState).not.toHaveBeenCalled()
    expect(mockApi.setInteractiveState).not.toHaveBeenCalled()
  })

  it('loads initial state from documentId url parameter', async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    // fetch response is intial interactive state
    setQueryParams("documentId=https://initial/state")
    mockFetch.mockImplementation(() => ({ ok: true, json: () => Promise.resolve("foo") }))

    const client = new CloudFileManagerClient()
    client.setAppOptions({ providers: ['interactiveApi'] })
    client.connect()
    const clientListener = jest.fn()
    client.listen(clientListener)
    const provider = client.providers[InteractiveApiProvider.Name] as InteractiveApiProvider
    await provider.isReady()
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(wasCalledWithEventOfType(clientListener, 'willOpenFile')).toBe(true)
    // the next line is now difficult to test because setInteractiveState returns a promise
    // expect(wasCalledWithEventOfType(clientListener, 'openedFile')).toBe(true)
    expect(mockApi.getInteractiveState).not.toHaveBeenCalled()
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(1)
    expect(mockApi.setInteractiveState.mock.calls[0][0]).toBe("foo")
  })

  it('rewrites initial state after loads from documentId url parameter', async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      },
      hostFeatures: {
        domain: "rewritten.domain" as any,
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    const initialInteractiveState = {
      some: {
        deep: {
          set: {
            of: {
              keys: {
                bool: true,
                num: 1,
                url: "https://codap.concord.org/sensor-interactive/"
              }
            }
          }
        }
      }
    }
    const replacedInitialInteractiveState = JSON.parse(JSON.stringify(initialInteractiveState).replace(/codap\.concord\.org/g, "rewritten.domain"))

    // fetch response is intial interactive state
    setQueryParams("documentId=https://initial/state")
    mockFetch.mockImplementation(() => ({ ok: true, json: () => Promise.resolve(initialInteractiveState)}))

    const client = new CloudFileManagerClient()
    client.setAppOptions({ providers: ['interactiveApi'] })
    client.connect()
    const clientListener = jest.fn()
    client.listen(clientListener)
    const provider = client.providers[InteractiveApiProvider.Name] as InteractiveApiProvider
    await provider.isReady()
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(wasCalledWithEventOfType(clientListener, 'willOpenFile')).toBe(true)
    // the next line is now difficult to test because setInteractiveState returns a promise
    // expect(wasCalledWithEventOfType(clientListener, 'openedFile')).toBe(true)
    expect(mockApi.getInteractiveState).not.toHaveBeenCalled()
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(1)
    expect(mockApi.setInteractiveState.mock.calls[0][0]).toStrictEqual(replacedInitialInteractiveState)
  })

  it("doesn't load initial state from documentId url parameter on failure", async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    // fetch response is initial interactive state
    setQueryParams("documentId=https://initial/state")
    mockFetch.mockImplementation(() => ({ ok: false }))

    const client = new CloudFileManagerClient()
    client.setAppOptions({ providers: ['interactiveApi'] })
    client.connect()
    const provider = client.providers[InteractiveApiProvider.Name] as InteractiveApiProvider
    await provider.isReady()
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).not.toHaveBeenCalled()
    expect(mockApi.setInteractiveState).not.toHaveBeenCalled()
  })

  it('should save/restore using attachments when configured to do so', async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    setQueryParams(`interactiveApi=${kAttachmentUrlParameter}`)

    const client = new CloudFileManagerClient()
    const content = new CloudContent('fooContent', { isCfmWrapped: false, isPreCfmFormat: false })
    const metadata = new CloudMetadata({ name: 'foo' })
    const provider = new InteractiveApiProvider({}, client)
    await provider.isReady()
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(0)

    // save with a callback
    mockApi.writeAttachment.mockImplementation(() => ({ ok: true }))
    const saveCallback = jest.fn()
    await provider.save(content, metadata, saveCallback)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(1)
    expect(mockApi.writeAttachment).toHaveBeenCalledTimes(1)
    expect(saveCallback).toHaveBeenCalled()
    expect(saveCallback.mock.calls[0][0]).toBeNull()

    // save without a callback
    await provider.save(content, metadata)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(2)
    expect(mockApi.writeAttachment).toHaveBeenCalledTimes(2)

    // handles save error
    mockApi.writeAttachment.mockImplementation(() => ({ ok: false, statusText: "No attachment for you!" }))
    saveCallback.mockReset()
    await provider.save(content, metadata, saveCallback)
    expect(mockApi.writeAttachment).toHaveBeenCalledTimes(3)
    expect(typeof saveCallback.mock.calls[0][0]).toBe("string")

    // load with callback
    mockApi.getInteractiveState.mockImplementation(() => ({ __attachment__: kAttachmentFilename }))
    mockApi.readAttachment.mockImplementation(() => ({ ok: true, text: () => "fooContent" }))
    const loadCallback = jest.fn()
    await provider.load(metadata, loadCallback)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(1)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(2)
    expect(mockApi.readAttachment).toHaveBeenCalledTimes(1)
    expect(loadCallback).toHaveBeenCalledTimes(1)
    expect(loadCallback.mock.calls[0][0]).toBeNull()

    // handles load error
    mockApi.readAttachment.mockImplementation(() => ({ ok: false, statusText: "No attachment for you!" }))
    loadCallback.mockReset()
    await provider.load(metadata, loadCallback)
    expect(mockApi.readAttachment).toHaveBeenCalledTimes(2)
    expect(typeof loadCallback.mock.calls[0][0]).toBe("string")
  })


  it('should save/restore using dynamic attachments when configured to do so', async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    const client = new CloudFileManagerClient()
    const content = new CloudContent('fooContent', { isCfmWrapped: false, isPreCfmFormat: false })
    const metadata = new CloudMetadata({ name: 'foo' })
    const provider = new InteractiveApiProvider({}, client)
    await provider.isReady()
    expect(provider.name).toBe(InteractiveApiProvider.Name)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(0)

    // save with a callback
    mockApi.writeAttachment.mockImplementation(() => ({ ok: true }))
    const saveCallback = jest.fn()
    await provider.save(content, metadata, saveCallback)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(1)
    expect(mockApi.writeAttachment).toHaveBeenCalledTimes(0)
    expect(saveCallback).toHaveBeenCalled()
    expect(saveCallback.mock.calls[0][0]).toBeNull()

    // save without a callback
    await provider.save(content, metadata)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(0)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(2)
    expect(mockApi.writeAttachment).not.toHaveBeenCalled()

    // load with callback
    mockApi.getInteractiveState.mockImplementation(() => "fooContent")
    mockApi.readAttachment.mockImplementation(() => ({ ok: true, text: () => "fooContent" }))
    const loadCallback = jest.fn()
    await provider.load(metadata, loadCallback)
    expect(mockApi.getInitInteractiveMessage).toHaveBeenCalledTimes(1)
    expect(mockApi.getInteractiveState).toHaveBeenCalledTimes(1)
    expect(mockApi.setInteractiveState).toHaveBeenCalledTimes(2)
    expect(mockApi.readAttachment).not.toHaveBeenCalled()
    expect(loadCallback).toHaveBeenCalledTimes(1)
    expect(loadCallback.mock.calls[0][0]).toBeNull()
  })

  it('should correctly determine when to use attachments', async () => {
    // getInitInteractiveMessage returns a promise that resolves to a mock initInteractiveMessage
    const mockInitInteractiveMessage: Partial<IRuntimeInitInteractive> = {
      version: 1,
      mode: "runtime",
      classInfoUrl: 'https://concord.org/classInfo',
      interactive: {
        id: "mw_interactive_100",
        name: ""
      }
    }
    mockApi.getInitInteractiveMessage
      .mockImplementation(() => Promise.resolve(mockInitInteractiveMessage))

    const client = new CloudFileManagerClient()
    const provider = new InteractiveApiProvider({}, client)
    await provider.isReady()

    const enclosingStringifiedQuoteLength = 2  // to account for "" enclosing the buffer when shouldSaveAsAttachment uses JSON.stringify
    const contentBelowThreshhold = Buffer.alloc(kDynamicAttachmentSizeThreshold - 1 - enclosingStringifiedQuoteLength, "x").toString()
    const contentAtThreshhold = Buffer.alloc(kDynamicAttachmentSizeThreshold - enclosingStringifiedQuoteLength, "x").toString()
    const contentAboveThreshhold = Buffer.alloc(kDynamicAttachmentSizeThreshold + 1 - enclosingStringifiedQuoteLength, "x").toString()

    // without an interactiveApi url param attachment use is determined by the length of the content
    expect(shouldSaveAsAttachment(contentBelowThreshhold)).toBe(false)
    expect(shouldSaveAsAttachment(contentAtThreshhold)).toBe(true)
    expect(shouldSaveAsAttachment(contentAboveThreshhold)).toBe(true)

    // with an explicit kAttachmentUrlParameter value attachments are always used
    setQueryParams(`interactiveApi=${kAttachmentUrlParameter}`)
    expect(shouldSaveAsAttachment(contentBelowThreshhold)).toBe(true)
    expect(shouldSaveAsAttachment(contentAtThreshhold)).toBe(true)
    expect(shouldSaveAsAttachment(contentAboveThreshhold)).toBe(true)
  })

})
