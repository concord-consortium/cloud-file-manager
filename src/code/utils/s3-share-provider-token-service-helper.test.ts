import { getLegacyUrl } from './s3-share-provider-token-service-helper'

const getTokenServiceEnvMock = jest.fn()
jest.mock('./config', () => {
  const { getTokenServiceEnv, ...others } = jest.requireActual('./config')
  return {
    getTokenServiceEnv: () => getTokenServiceEnvMock(),
    ...others
  }
})

const legacyId = "23424"

describe("s3-share-provider-token-service-helper", () => {
  describe("production environment", () => {
    beforeEach( () => {
      getTokenServiceEnvMock.mockReset()
      getTokenServiceEnvMock.mockImplementation(() => 'production')
    })
    describe("getLegacyUrl", () => {
      it("should return a production legacy url … ", () => {
        const result = getLegacyUrl(legacyId)
        expect(result).toEqual("https://models-resources.concord.org/legacy-document-store/23424")
      })
    })
  })
  describe("staging environment", () => {
    beforeEach( () => {
      getTokenServiceEnvMock.mockReset()
      getTokenServiceEnvMock.mockImplementation(() => 'staging')
    })
    describe("getLegacyUrl", () => {
      it("should return a legacy url … ", () => {
        const result = getLegacyUrl(legacyId)
        expect(result).toEqual("https://token-service-files.concordqa.org/legacy-document-store/23424")
      })
    })
  })
})
