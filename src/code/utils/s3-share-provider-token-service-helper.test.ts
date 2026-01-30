import { getLegacyUrl, createFile, updateFile, deleteFile } from './s3-share-provider-token-service-helper'

const getTokenServiceEnvMock = jest.fn()
jest.mock('./config', () => {
  const { getTokenServiceEnv, ...others } = jest.requireActual('./config')
  return {
    getTokenServiceEnv: () => getTokenServiceEnvMock(),
    ...others
  }
})

// Mock the token-service client
const mockCreateResource = jest.fn()
const mockGetReadWriteToken = jest.fn()
const mockGetCredentials = jest.fn()
const mockGetPublicS3Path = jest.fn()
const mockGetPublicS3Url = jest.fn()
const mockGetResource = jest.fn()

jest.mock('@concord-consortium/token-service', () => {
  return {
    TokenServiceClient: jest.fn().mockImplementation(() => ({
      createResource: mockCreateResource,
      getReadWriteToken: mockGetReadWriteToken,
      getCredentials: mockGetCredentials,
      getPublicS3Path: mockGetPublicS3Path,
      getPublicS3Url: mockGetPublicS3Url,
      getResource: mockGetResource
    }))
  }
})

// Mock S3
const mockUploadPromise = jest.fn()
const mockDeleteObjectPromise = jest.fn()
const mockUpload = jest.fn(() => ({ promise: mockUploadPromise }))
const mockDeleteObject = jest.fn(() => ({ promise: mockDeleteObjectPromise }))

jest.mock('aws-sdk/clients/s3', () => {
  return jest.fn().mockImplementation(() => ({
    upload: mockUpload,
    deleteObject: mockDeleteObject
  }))
})

const legacyId = "23424"

// Common test data
const mockResource = {
  id: 'resource-123',
  bucket: 'test-bucket',
  region: 'us-east-1',
  publicPath: 'public/path'
}

const mockCredentials = {
  accessKeyId: 'test-access-key',
  secretAccessKey: 'test-secret-key',
  sessionToken: 'test-session-token'
}

const mockReadWriteToken = 'test-read-write-token'
const mockPublicPath = 'cfm-shared/resource-123/file.json'
const mockPublicUrl = 'https://test-bucket.s3.amazonaws.com/cfm-shared/resource-123/file.json'

describe("s3-share-provider-token-service-helper", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getTokenServiceEnvMock.mockReset()
    getTokenServiceEnvMock.mockImplementation(() => 'production')
  })

  describe("production environment", () => {
    beforeEach( () => {
      getTokenServiceEnvMock.mockReset()
      getTokenServiceEnvMock.mockImplementation(() => 'production')
    })
    describe("getLegacyUrl", () => {
      it("should return a production legacy url …", () => {
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
      it("should return a legacy url …", () => {
        const result = getLegacyUrl(legacyId)
        expect(result).toEqual("https://token-service-files.concordqa.org/legacy-document-store/23424")
      })
    })
  })

  describe("createFile", () => {
    beforeEach(() => {
      mockCreateResource.mockResolvedValue(mockResource)
      mockGetReadWriteToken.mockReturnValue(mockReadWriteToken)
      mockGetCredentials.mockResolvedValue(mockCredentials)
      mockGetPublicS3Path.mockReturnValue(mockPublicPath)
      mockGetPublicS3Url.mockReturnValue(mockPublicUrl)
      mockUploadPromise.mockResolvedValue({})
    })

    it("should create a resource and upload file to S3", async () => {
      const fileContent = '{"test": "content"}'
      const result = await createFile({ fileContent })

      // Verify resource creation
      expect(mockCreateResource).toHaveBeenCalledWith({
        tool: 'cfm-shared',
        type: 's3Folder',
        name: 'file.json',
        description: 'Document created by CFM',
        accessRuleType: 'readWriteToken'
      })

      // Verify credentials were obtained
      expect(mockGetCredentials).toHaveBeenCalledWith(mockResource.id, mockReadWriteToken)

      // Verify S3 upload was called with correct parameters
      expect(mockUpload).toHaveBeenCalledWith({
        Bucket: mockResource.bucket,
        Key: mockPublicPath,
        Body: fileContent,
        ContentType: 'text/html',
        ContentEncoding: 'UTF-8',
        CacheControl: 'max-age=60'
      })

      // Verify returned values
      expect(result).toEqual({
        publicUrl: mockPublicUrl,
        resourceId: mockResource.id,
        readWriteToken: mockReadWriteToken
      })
    })

    it("should return empty string for readWriteToken when not available", async () => {
      mockGetReadWriteToken.mockReturnValue(null)
      const fileContent = '{"test": "content"}'
      const result = await createFile({ fileContent })

      expect(result.readWriteToken).toEqual('')
    })

    it("should use the token service environment from config", async () => {
      const { TokenServiceClient } = require('@concord-consortium/token-service')

      getTokenServiceEnvMock.mockImplementation(() => 'staging')
      await createFile({ fileContent: 'test' })

      expect(TokenServiceClient).toHaveBeenCalledWith({ env: 'staging' })
    })
  })

  describe("updateFile", () => {
    beforeEach(() => {
      mockGetResource.mockResolvedValue(mockResource)
      mockGetCredentials.mockResolvedValue(mockCredentials)
      mockGetPublicS3Path.mockReturnValue(mockPublicPath)
      mockUploadPromise.mockResolvedValue({})
    })

    it("should get existing resource and upload new content", async () => {
      const newFileContent = '{"updated": "content"}'
      const resourceId = 'resource-123'

      await updateFile({ newFileContent, resourceId, readWriteToken: mockReadWriteToken })

      // Verify resource was fetched
      expect(mockGetResource).toHaveBeenCalledWith(resourceId)

      // Verify credentials were obtained with readWriteToken
      expect(mockGetCredentials).toHaveBeenCalledWith(mockResource.id, mockReadWriteToken)

      // Verify S3 upload was called with correct parameters
      expect(mockUpload).toHaveBeenCalledWith({
        Bucket: mockResource.bucket,
        Key: mockPublicPath,
        Body: newFileContent,
        ContentType: 'text/html',
        ContentEncoding: 'UTF-8',
        CacheControl: 'max-age=60'
      })
    })

    it("should work without readWriteToken", async () => {
      const newFileContent = '{"updated": "content"}'
      const resourceId = 'resource-123'

      await updateFile({ newFileContent, resourceId })

      // Verify credentials were obtained with undefined readWriteToken
      expect(mockGetCredentials).toHaveBeenCalledWith(mockResource.id, undefined)
    })

    it("should use the token service environment from config", async () => {
      const { TokenServiceClient } = require('@concord-consortium/token-service')

      getTokenServiceEnvMock.mockImplementation(() => 'staging')
      await updateFile({ newFileContent: 'test', resourceId: 'resource-123' })

      expect(TokenServiceClient).toHaveBeenCalledWith({ env: 'staging' })
    })
  })

  describe("deleteFile", () => {
    beforeEach(() => {
      mockGetResource.mockResolvedValue(mockResource)
      mockGetCredentials.mockResolvedValue(mockCredentials)
      mockGetPublicS3Path.mockReturnValue(mockPublicPath)
      mockDeleteObjectPromise.mockResolvedValue({})
    })

    it("should get existing resource and delete from S3", async () => {
      const resourceId = 'resource-123'

      await deleteFile({ resourceId, readWriteToken: mockReadWriteToken })

      // Verify resource was fetched
      expect(mockGetResource).toHaveBeenCalledWith(resourceId)

      // Verify credentials were obtained with readWriteToken
      expect(mockGetCredentials).toHaveBeenCalledWith(mockResource.id, mockReadWriteToken)

      // Verify S3 deleteObject was called with correct parameters
      expect(mockDeleteObject).toHaveBeenCalledWith({
        Bucket: mockResource.bucket,
        Key: mockPublicPath
      })
    })

    it("should work without readWriteToken", async () => {
      const resourceId = 'resource-123'

      await deleteFile({ resourceId })

      // Verify credentials were obtained with undefined readWriteToken
      expect(mockGetCredentials).toHaveBeenCalledWith(mockResource.id, undefined)
    })

    it("should use the token service environment from config", async () => {
      const { TokenServiceClient } = require('@concord-consortium/token-service')

      getTokenServiceEnvMock.mockImplementation(() => 'staging')
      await deleteFile({ resourceId: 'resource-123' })

      expect(TokenServiceClient).toHaveBeenCalledWith({ env: 'staging' })
    })
  })
})
