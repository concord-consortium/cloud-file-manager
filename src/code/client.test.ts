import {CloudFileManagerClient, CloudFileManagerClientEvent} from "./client"
import { CloudContent } from "./providers/provider-interface"

jest.mock('@concord-consortium/lara-interactive-api')
const mockApi = require('@concord-consortium/lara-interactive-api')
mockApi.getInitInteractiveMessage.mockImplementation(() => Promise.resolve({
  interactive: {
    id: 1,
    name: "",
    questionId: "mw_interactive_100"
  }
}))

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

  describe('Test Provider', () => {
    let client: CloudFileManagerClient
    beforeEach(() => {
      client = new CloudFileManagerClient()
      const options = {
        providers: [
          "testProvider"
        ]
      }
      client.setAppOptions(options)
    })

    test('loading provider', () => {
      expect(Object.keys(client.providers).length).toBe(1)
      expect(client.providers.testProvider.name).toBe('testProvider')
    })

    test('filtering content saves', (done) => {
      const testProvider = client.providers.testProvider

      // instead of adding or changing client functions to allow for metadata sets call into this "private" function
      // to set the current metadata in order to fake the file already having been loaded
      client._setState({metadata: {
        name: "foo.txt",
        provider: testProvider
      } as any})

      // initial save works without filtering
      client.saveContent("foo", (content: CloudContent, metadata) => {
        expect(content.getClientContent()).toEqual("foo")

        client.appOptions.contentSaveFilter = (content: CloudContent) => {
          // beetlejuice, beetlejuice, beetlejuice
          content.content.content = "bar"
          return content;
        }

        client.saveContent("foo", (content: CloudContent, metadata) => {
          expect(content.getClientContent()).toEqual("bar")

          done()
        })
      })
    })
  })

  describe("getCurrentUrl", () => {
    let location: Location
    let client: CloudFileManagerClient

    beforeAll(() => {
      location = window.location
      delete window.location
    })
    beforeEach(() => {
      client = new CloudFileManagerClient()
    })
    afterAll(() => {
      window.location = location
    })
    test("without query or hash string", () => {
      window.location = {
        origin: "https://example.com",
        pathname: "/foo",
        search: ""
      } as any
      expect(client.getCurrentUrl()).toEqual("https://example.com/foo")
    })
    test("with query but no hash string", () => {
      window.location = {
        origin: "https://example.com",
        pathname: "/foo",
        search: "?bar=baz"
      } as any
      expect(client.getCurrentUrl()).toEqual("https://example.com/foo?bar=baz")
    })
    test("without query but with hash string", () => {
      window.location = {
        origin: "https://example.com",
        pathname: "/foo",
        search: ""
      } as any
      expect(client.getCurrentUrl("#bang=boom")).toEqual("https://example.com/foo#bang=boom")
    })
    test("with query and hash string", () => {
      window.location = {
        origin: "https://example.com",
        pathname: "/foo",
        search: "?bar=baz"
      } as any
      expect(client.getCurrentUrl("#bang=boom")).toEqual("https://example.com/foo?bar=baz#bang=boom")
    })
  })
})
