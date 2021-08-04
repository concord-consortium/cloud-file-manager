import {CloudFileManagerClient, CloudFileManagerClientEvent} from "./client"

jest.mock('@concord-consortium/lara-interactive-api')
const mockApi = require('@concord-consortium/lara-interactive-api')
mockApi.getInitInteractiveMessage.mockImplementation(() => Promise.resolve({}))

describe("CloudFileManagerClientEvent", () => {

  test('increments id with each event registered', () => {
    const clientEvent = new CloudFileManagerClientEvent("any")
    expect(clientEvent.id).toBe(1)
    const clientEvent2 = new CloudFileManagerClientEvent("any")
    expect(clientEvent2.id).toBe(2)
  })
})

describe("CloudFileManagerClient", () => {

  function availableProvidersIncludes(client: CloudFileManagerClient, provider: string) {
    return client.state.availableProviders.some(p => p.name === provider)
  }

  function availableProvidersAreUnique(client: CloudFileManagerClient) {
    let hasDuplicates = false
    const counts: Record<string, number> = {}
    client.state.availableProviders.forEach(p => {
      if (counts[p.name]) hasDuplicates = true
      else counts[p.name] = 1
    })
    return !hasDuplicates
  }

  test('creates a list of its providers', () => {
    const client = new CloudFileManagerClient()
    const options = {
      providers: [
        "localStorage",
        "localFile",
        "lara"
      ]
    }
    client.setAppOptions(options)
    expect(Object.keys(client.providers).length).toBe(4)
    expect(client.providers.localStorage.name).toBe('localStorage')
    expect(client.providers.localFile.name).toBe('localFile')
    expect(client.providers.lara.name).toBe('lara')
    // InteractiveApiProvider should be included when LaraProvider is specified
    expect(client.providers.interactiveApi.name).toBe('interactiveApi')
    expect(availableProvidersIncludes(client, 'localStorage')).toBe(true)
    expect(availableProvidersIncludes(client, 'localFile')).toBe(true)
    expect(availableProvidersIncludes(client, 'lara')).toBe(true)
    // InteractiveApiProvider should be included when LaraProvider is specified
    expect(availableProvidersIncludes(client, 'interactiveApi')).toBe(true)
  })

  test('only includes InteractiveApiProvider once when requested', () => {
    const client = new CloudFileManagerClient()
    const options = {
      providers: [
        "lara",
        "interactiveApi"
      ]
    }
    client.setAppOptions(options)
    expect(Object.keys(client.providers).length).toBe(2)
    expect(client.providers.lara.name).toBe('lara')
    expect(client.providers.interactiveApi.name).toBe('interactiveApi')
    expect(availableProvidersIncludes(client, 'lara')).toBe(true)
    expect(availableProvidersIncludes(client, 'interactiveApi')).toBe(true)
    // InteractiveApiProvider (or any provider) should only be added once
    expect(availableProvidersAreUnique(client)).toBe(true)
  })

})
