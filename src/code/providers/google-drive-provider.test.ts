import { CloudFileManagerClient } from "../client"
import GoogleDriveProvider from "./google-drive-provider"

describe('GoogleDriveProvider', () => {

  const clientId = 'mockClientId'
  const apiKey = 'mockApiKey'

  const client = new CloudFileManagerClient()

  it('should throw exception without credentials', () => {
    expect(() => new GoogleDriveProvider({} as any, client)).toThrow()
    expect(() => new GoogleDriveProvider({ clientId } as any, client)).toThrow()
    expect(() => new GoogleDriveProvider({ apiKey } as any, client)).toThrow()
    expect(() => new GoogleDriveProvider({ clientId, apiKey }, client)).not.toThrow()
  })

  it('should load the google API only once', () => {
    const provider = new GoogleDriveProvider({ clientId, apiKey }, client)
    const promise1 = GoogleDriveProvider.apiLoadPromise
    const promise2 = provider.waitForAPILoad()
    expect(promise1).toBe(promise2)
    const promise3 = provider.waitForAPILoad()
    expect(promise1).toBe(promise3)
    expect(promise2).toBe(promise3)
  })

})
