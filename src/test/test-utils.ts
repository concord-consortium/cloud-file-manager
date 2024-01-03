import { CloudFileManagerClient } from "../code/client"

interface CFMTestClientOptions {
  skipCallTest?: boolean
}

export function createCFMTestClient({skipCallTest = false}: CFMTestClientOptions = {}) {
  let client = {} as CloudFileManagerClient
  jestSpyConsole("warn", spy => {
    client = new CloudFileManagerClient()
    if (!skipCallTest) {
      expect(spy).toHaveBeenCalledTimes(1)
    }
  })
  return client
}
