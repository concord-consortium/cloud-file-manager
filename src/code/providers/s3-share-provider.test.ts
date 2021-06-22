
import S3ShareProvider from "./s3-share-provider"
import { CloudFileManagerClient } from "../client"
import { CloudContent, CloudContentFormat, CloudMetadata } from "./provider-interface"
import LocalStorageProvider from './localstorage-provider'

const publicUrl = 'publicUrl'
const resourceId = 'resourceId'
const readWriteToken = 'RWToken'
const mockResult = new Promise( resolve => {
  resolve ({ publicUrl, resourceId, readWriteToken })
})

jest.mock('../utils/s3-share-provider-token-service-helper', () => {
  return {
    createFile: () => mockResult,
    updateFile: () => mockResult
  }
})

const client = new CloudFileManagerClient()
const localstorageProvider = new LocalStorageProvider({}, client)
const testContentFormat: CloudContentFormat = { isCfmWrapped: false, isPreCfmFormat: true }

describe("S3ShareProvider", () => {
  const provider = new S3ShareProvider(client, localstorageProvider)
  const masterContent = new CloudContent({content: "test"}, testContentFormat)
  const sharedContent = new CloudContent({content: "test 2"}, testContentFormat)
  const metadata = new CloudMetadata({filename: "test"})

  describe("share", () => {
    describe("When not previously shared", () => {
      it("Should return a new ReadWrite token", done => {
        const callback = (error:any, data: any) => {
          try {
            // Don't expect an error:
            expect(error).toBeNull()
            // Expect the Read & write token in the callback:
            expect(data).toBe(readWriteToken)
            const originalDoc = masterContent.getContent()
            // expect the masterConent to now have a sharedDocumentId:
            expect(originalDoc?.sharedDocumentId).toBe(resourceId)
            // expect the masterConent to now have a sharedDocumentUrl:
            expect(originalDoc?.sharedDocumentUrl).toBe(publicUrl)
            // expect the masterConent to now have a readWriteToken:
            expect(originalDoc?.accessKeys?.readWrite).toBe(readWriteToken)
            done()
          }
          catch(e) {
            done(e)
          }
        }
        const result = provider.share(true, masterContent, sharedContent, metadata, callback)
        // the share method doesn't return anything ...
        expect(result).toBeUndefined()
      })
    })

  })
})
