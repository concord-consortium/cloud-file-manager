import { CloudContent, cloudContentFactory } from "./provider-interface"

describe("ProviderInterface", () => {

  it("wraps/unwraps client content with `metadata` property (e.g. CODAP v2)", () => {
    const docContent = { metadata: {} }
    expect(CloudContent.isClientContent(docContent)).toBe(true)
    const wrappedContent = cloudContentFactory.createEnvelopedCloudContent(docContent)
    const unwrappedContent = wrappedContent.getClientContent()
    expect(unwrappedContent).toEqual(docContent)
    expect(CloudContent.isClientContent(unwrappedContent)).toBe(true)
  })

  it("can't wrap/unwrap client content with `content` property (e.g. CODAP v3) without isClientContent", () => {
    const docContent = { content: { isContent: true } }
    const wrappedContent = cloudContentFactory.createEnvelopedCloudContent(docContent)
    const unwrappedContentFail = wrappedContent.getClientContent()
    // without the isClientContent override, unwrapping fails
    expect(unwrappedContentFail).not.toEqual(docContent)
  })

  it("wraps/unwraps client content with `content` property (e.g. CODAP v3) with isClientContent", () => {
    const docContent = { content: { isContent: true } }
    // with the isClientContent override, unwrapping succeeds
    CloudContent.isClientContent = (inContent: any) => !!inContent?.content?.isContent
    expect(CloudContent.isClientContent(docContent)).toBe(true)
    const wrappedContent = cloudContentFactory.createEnvelopedCloudContent(docContent)
    const unwrappedContent = wrappedContent.getClientContent()
    expect(CloudContent.isClientContent(unwrappedContent)).toBe(true)
    expect(unwrappedContent).toEqual(docContent)
  })

})
