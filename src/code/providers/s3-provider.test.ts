
import S3Provider from "./s3-provider"
import { CloudMetadata } from "./provider-interface"
import { createCFMTestClient } from "../../test/test-utils"

const client = createCFMTestClient()

describe("S3ShareProvider", () => {
  const provider = new S3Provider(client)
  describe("load(metadata: CloudMetadata, callback: callbackSigLoad)", () => {
    describe("when using a legacy documentID", () => {
      it('should return a legacy url', () => {
        const contentId = "1234"
        const metadata = new CloudMetadata({filename: "test", sharedContentId: contentId})
        const callback = (err: string | null, content?: any) => {  }
        provider.loadFromUrl = (string) => { expect(string).toMatch("legacy-document-store/1234") }
        provider.load(metadata, callback)
      })
    })

    describe("when the ID is a full URL", () => {
      it('should return the url', () => {
        const urlToContent = "https://somethingcool/1234sdfsf/foo.txt"
        const metadata = new CloudMetadata({filename: "test", sharedContentId: urlToContent})
        const callback = (err: string | null, content?: any) => {  }
        provider.loadFromUrl = (string) => { expect(string).toBe(urlToContent) }
        provider.load(metadata, callback)
      })
    })

  })
})
