import { CloudFileManagerClient } from "../client"
import LegacyGoogleDriveProvider from "./legacy-google-drive-provider"

describe('LegacyGoogleDriveProvider', () => {

  const clientId = 'mockClientId'
  const apiKey = 'mockApiKey'

  const client = new CloudFileManagerClient()

  it('should throw exception without credentials', () => {
    expect(() => new LegacyGoogleDriveProvider({} as any, client)).toThrow()
    expect(() => new LegacyGoogleDriveProvider({ clientId } as any, client)).toThrow()
    expect(() => new LegacyGoogleDriveProvider({ apiKey } as any, client)).toThrow()
    expect(() => new LegacyGoogleDriveProvider({ clientId, apiKey }, client)).not.toThrow()
  })

  it('should load the google API only once', () => {
    const provider = new LegacyGoogleDriveProvider({ clientId, apiKey }, client)
    const promise1 = LegacyGoogleDriveProvider.apiLoadPromise
    const promise2 = provider.waitForAPILoad()
    expect(promise1).toBe(promise2)
    const promise3 = provider.waitForAPILoad()
    expect(promise1).toBe(promise3)
    expect(promise2).toBe(promise3)
  })

})
