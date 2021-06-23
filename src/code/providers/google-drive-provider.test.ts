import { CloudFileManagerClient } from "../client"
import GoogleDriveProvider from "./google-drive-provider"

describe('GoogleDriveProvider', () => {

  const clientId = 'mockClientId'
  const apiKey = 'mockApiKey'

  const client = new CloudFileManagerClient()

  beforeEach(() => {
    GoogleDriveProvider.loadPromise = null
  })

  it('should throw exception without credentials', () => {
    expect(() => new GoogleDriveProvider({} as any, client)).toThrow()
    expect(() => new GoogleDriveProvider({ clientId } as any, client)).toThrow()
    expect(() => new GoogleDriveProvider({ apiKey } as any, client)).toThrow()
    expect(() => new GoogleDriveProvider({ clientId, apiKey }, client)).not.toThrow()
  })

  it('should load the google API only once', () => {
    const createElementSpy = jest.spyOn(document, 'createElement')
    const appendChildSpy = jest.spyOn(document.head, 'appendChild').mockImplementation(() => null)
    const provider = new GoogleDriveProvider({ clientId, apiKey }, client)
    expect(createElementSpy).toHaveBeenCalledTimes(1)
    expect(createElementSpy.mock.results[0].value.src).toBe('https://apis.google.com/js/api.js')
    expect(appendChildSpy).toHaveBeenCalledTimes(1)
    const promise1 = GoogleDriveProvider.loadPromise
    const promise2 = provider._waitForGAPILoad()
    expect(createElementSpy).toHaveBeenCalledTimes(1)
    expect(appendChildSpy).toHaveBeenCalledTimes(1)
    expect(promise1).toBe(promise2)
  })

})
