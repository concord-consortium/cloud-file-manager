import {CloudFileManagerClient, CloudFileManagerClientEvent} from "./client"

test('ClientEvent id increments with each event registered', () => {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 1.
  const clientEvent = new CloudFileManagerClientEvent({type: "any", data: {}, state: {}})
  expect(clientEvent.id).toBe(1)
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 1.
  const clientEvent2 = new CloudFileManagerClientEvent({type: "any", data: {}, state: {}})
  expect(clientEvent2.id).toBe(2)
})


test('Client creates a list of its providers', () => {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
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
  expect((client.providers as any).localStorage.name).toBe('localStorage')
  expect((client.providers as any).localFile.name).toBe('localFile')
  expect((client.providers as any).lara.name).toBe('lara')
})