import {CloudFileManagerClient, CloudFileManagerClientEvent} from "./client"

describe("CloudFileManagerClientEvent", () => {

  test('increments id with each event registered', () => {
    const clientEvent = new CloudFileManagerClientEvent("any")
    expect(clientEvent.id).toBe(1)
    const clientEvent2 = new CloudFileManagerClientEvent("any")
    expect(clientEvent2.id).toBe(2)
  })
})

describe("CloudFileManagerClient", () => {

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
    expect(Object.keys(client.providers).length).toBe(3)
    expect(client.providers.localStorage.name).toBe('localStorage')
    expect(client.providers.localFile.name).toBe('localFile')
    expect(client.providers.lara.name).toBe('lara')
  })

})
