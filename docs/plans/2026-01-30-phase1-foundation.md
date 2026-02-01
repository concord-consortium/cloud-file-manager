# Phase 1: Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Modernize TypeScript configuration to ES2020, migrate AWS SDK v2 to v3, and update dependencies.

**Architecture:** Update tsconfig files in cascade order (base → lib → cjs/esm), migrate single AWS SDK file to v3 modular client, update safe dependencies.

**Tech Stack:** TypeScript 5.x, AWS SDK v3 (`@aws-sdk/client-s3`), Node.js

---

## Task 1: Update TypeScript Base Configuration

**Files:**
- Modify: `tsconfig.json`

**Step 1: Read current tsconfig.json**

Current content:
```json
{
  "compilerOptions": {
    "outDir": "./dist/",
    "sourceMap": true,
    "noImplicitAny": true,
    "module": "commonjs",
    "esModuleInterop": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "target": "es5",
    "jsx": "react",
    "allowJs": true,
    "diagnostics": true,
    "experimentalDecorators": true
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.jsx",
    "src/**/*.js"
  ]
}
```

**Step 2: Update tsconfig.json with modern settings**

```json
{
  "compilerOptions": {
    "outDir": "./dist/",
    "sourceMap": true,
    "noImplicitAny": true,
    "module": "commonjs",
    "esModuleInterop": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react",
    "allowJs": true,
    "diagnostics": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.jsx",
    "src/**/*.js"
  ]
}
```

Key changes:
- `target`: es5 → ES2020
- Added `lib`: ES2020, DOM, DOM.Iterable
- Added `skipLibCheck`: true (speeds up compilation)
- Added `forceConsistentCasingInFileNames`: true
- Removed `experimentalDecorators` (not used)

**Step 3: Verify webpack build works**

Run: `npm run build`
Expected: Build completes without errors

**Step 4: Verify tests pass**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add tsconfig.json
git commit -m "build: update base tsconfig to target ES2020"
```

---

## Task 2: Update TypeScript Library Configuration

**Files:**
- Modify: `tsconfig-lib.json`

**Step 1: Read current tsconfig-lib.json**

Current content:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "target": "ES2018"
  },
  "include": [
    "src/code"
  ],
  "exclude": [
    "src/code/app.tsx",
    "src/code/autolaunch",
    "src/code/globals.ts",
    "**/*.test.*"
  ]
}
```

**Step 2: Update tsconfig-lib.json**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "target": "ES2020"
  },
  "include": [
    "src/code"
  ],
  "exclude": [
    "src/code/app.tsx",
    "src/code/autolaunch",
    "src/code/globals.ts",
    "**/*.test.*"
  ]
}
```

Key change:
- `target`: ES2018 → ES2020 (aligns with ESM module setting)

**Step 3: Verify library build works**

Run: `npm run build:library`
Expected: Both CJS and ESM builds complete without errors

**Step 4: Commit**

```bash
git add tsconfig-lib.json
git commit -m "build: update library tsconfig to target ES2020"
```

---

## Task 3: Install AWS SDK v3

**Files:**
- Modify: `package.json`

**Step 1: Install AWS SDK v3 S3 client**

Run: `npm install @aws-sdk/client-s3`
Expected: Package installs successfully

**Step 2: Verify package.json updated**

Check that `@aws-sdk/client-s3` is in dependencies.

**Step 3: Verify build still works**

Run: `npm run build`
Expected: Build completes without errors

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add AWS SDK v3 S3 client"
```

---

## Task 4: Add Tests for S3 Helper Functions

**Files:**
- Modify: `src/code/utils/s3-share-provider-token-service-helper.test.ts`

The existing tests only cover `getLegacyUrl`. We need to add tests for `createFile`, `updateFile`, and `deleteFile` before migrating to AWS SDK v3.

**Step 1: Add mocks for TokenServiceClient and S3**

Add these mocks at the top of the test file, after the existing mock:

```typescript
import { createFile, updateFile, deleteFile, getLegacyUrl } from './s3-share-provider-token-service-helper'

const getTokenServiceEnvMock = jest.fn()
jest.mock('./config', () => {
  const { getTokenServiceEnv, ...others } = jest.requireActual('./config')
  return {
    getTokenServiceEnv: () => getTokenServiceEnvMock(),
    ...others
  }
})

// Mock TokenServiceClient
const mockCreateResource = jest.fn()
const mockGetReadWriteToken = jest.fn()
const mockGetCredentials = jest.fn()
const mockGetPublicS3Path = jest.fn()
const mockGetPublicS3Url = jest.fn()
const mockGetResource = jest.fn()

jest.mock('@concord-consortium/token-service', () => ({
  TokenServiceClient: jest.fn().mockImplementation(() => ({
    createResource: mockCreateResource,
    getReadWriteToken: mockGetReadWriteToken,
    getCredentials: mockGetCredentials,
    getPublicS3Path: mockGetPublicS3Path,
    getPublicS3Url: mockGetPublicS3Url,
    getResource: mockGetResource
  }))
}))

// Mock AWS SDK S3
const mockUpload = jest.fn()
const mockDeleteObject = jest.fn()

jest.mock('aws-sdk/clients/s3', () => {
  return jest.fn().mockImplementation(() => ({
    upload: mockUpload,
    deleteObject: mockDeleteObject
  }))
})
```

**Step 2: Add test for createFile**

```typescript
describe("createFile", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getTokenServiceEnvMock.mockImplementation(() => 'staging')

    mockCreateResource.mockResolvedValue({
      id: 'resource-123',
      bucket: 'test-bucket',
      region: 'us-east-1'
    })
    mockGetReadWriteToken.mockReturnValue('rw-token-abc')
    mockGetCredentials.mockResolvedValue({
      accessKeyId: 'AKID',
      secretAccessKey: 'SECRET',
      sessionToken: 'SESSION'
    })
    mockGetPublicS3Path.mockReturnValue('path/to/file.json')
    mockGetPublicS3Url.mockReturnValue('https://example.com/path/to/file.json')
    mockUpload.mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    })
  })

  it("should create a file and return public URL and credentials", async () => {
    const result = await createFile({ fileContent: '{"test": "data"}' })

    expect(mockCreateResource).toHaveBeenCalledWith({
      tool: expect.any(String),
      type: expect.any(String),
      name: 'file.json',
      description: 'Document created by CFM',
      accessRuleType: 'readWriteToken'
    })
    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      Bucket: 'test-bucket',
      Body: '{"test": "data"}',
      ContentType: 'text/html'
    }))
    expect(result).toEqual({
      publicUrl: 'https://example.com/path/to/file.json',
      resourceId: 'resource-123',
      readWriteToken: 'rw-token-abc'
    })
  })
})
```

**Step 3: Add test for updateFile**

```typescript
describe("updateFile", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getTokenServiceEnvMock.mockImplementation(() => 'staging')

    mockGetResource.mockResolvedValue({
      id: 'resource-123',
      bucket: 'test-bucket',
      region: 'us-east-1'
    })
    mockGetCredentials.mockResolvedValue({
      accessKeyId: 'AKID',
      secretAccessKey: 'SECRET',
      sessionToken: 'SESSION'
    })
    mockGetPublicS3Path.mockReturnValue('path/to/file.json')
    mockUpload.mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    })
  })

  it("should update an existing file", async () => {
    await updateFile({
      newFileContent: '{"updated": "data"}',
      resourceId: 'resource-123',
      readWriteToken: 'rw-token-abc'
    })

    expect(mockGetResource).toHaveBeenCalledWith('resource-123')
    expect(mockGetCredentials).toHaveBeenCalledWith('resource-123', 'rw-token-abc')
    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      Bucket: 'test-bucket',
      Body: '{"updated": "data"}',
      ContentType: 'text/html'
    }))
  })
})
```

**Step 4: Add test for deleteFile**

```typescript
describe("deleteFile", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getTokenServiceEnvMock.mockImplementation(() => 'staging')

    mockGetResource.mockResolvedValue({
      id: 'resource-123',
      bucket: 'test-bucket',
      region: 'us-east-1'
    })
    mockGetCredentials.mockResolvedValue({
      accessKeyId: 'AKID',
      secretAccessKey: 'SECRET',
      sessionToken: 'SESSION'
    })
    mockGetPublicS3Path.mockReturnValue('path/to/file.json')
    mockDeleteObject.mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    })
  })

  it("should delete an existing file", async () => {
    await deleteFile({
      resourceId: 'resource-123',
      readWriteToken: 'rw-token-abc'
    })

    expect(mockGetResource).toHaveBeenCalledWith('resource-123')
    expect(mockGetCredentials).toHaveBeenCalledWith('resource-123', 'rw-token-abc')
    expect(mockDeleteObject).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'path/to/file.json'
    })
  })
})
```

**Step 5: Run tests to verify they pass with current implementation**

Run: `npm test -- --testPathPattern=s3-share-provider-token-service-helper`
Expected: All tests pass (confirms mocks work correctly with v2 SDK)

**Step 6: Commit**

```bash
git add src/code/utils/s3-share-provider-token-service-helper.test.ts
git commit -m "test: add tests for S3 helper createFile, updateFile, deleteFile"
```

---

## Task 5: Migrate AWS SDK Usage

**Files:**
- Modify: `src/code/utils/s3-share-provider-token-service-helper.ts`
- Modify: `src/code/utils/s3-share-provider-token-service-helper.test.ts` (update mocks)

**Step 1: Update the mock in the test file for AWS SDK v3**

Replace the AWS SDK v2 mock:
```typescript
// Old mock
jest.mock('aws-sdk/clients/s3', () => {
  return jest.fn().mockImplementation(() => ({
    upload: mockUpload,
    deleteObject: mockDeleteObject
  }))
})
```

With AWS SDK v3 mock:
```typescript
// Mock AWS SDK v3
const mockSend = jest.fn()

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend
  })),
  PutObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'PutObject' })),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'DeleteObject' }))
}))
```

Update the test assertions to use `mockSend` instead of `mockUpload`/`mockDeleteObject`:

In createFile test:
```typescript
mockSend.mockResolvedValue({})
// ...
expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
  Bucket: 'test-bucket',
  Body: '{"test": "data"}',
  ContentType: 'text/html',
  _type: 'PutObject'
}))
```

In updateFile test:
```typescript
mockSend.mockResolvedValue({})
// ...
expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
  Bucket: 'test-bucket',
  Body: '{"updated": "data"}',
  ContentType: 'text/html',
  _type: 'PutObject'
}))
```

In deleteFile test:
```typescript
mockSend.mockResolvedValue({})
// ...
expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
  Bucket: 'test-bucket',
  Key: 'path/to/file.json',
  _type: 'DeleteObject'
}))
```

**Step 2: Run tests - expect failures (SDK not migrated yet)**

Run: `npm test -- --testPathPattern=s3-share-provider-token-service-helper`
Expected: Tests fail (implementation still uses v2 SDK)

**Step 3: Update imports in s3-share-provider-token-service-helper.ts**

Replace:
```typescript
import S3 from "aws-sdk/clients/s3"
```

With:
```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
```

**Step 4: Update createFile function**

Replace lines 36-49:
```typescript
const s3 = new S3({ region, accessKeyId, secretAccessKey, sessionToken })
const publicPath = client.getPublicS3Path(resource, FILENAME)

await s3.upload({
  Bucket: bucket,
  Key: publicPath,
  Body: fileContent,
  ContentType: "text/html",
  ContentEncoding: "UTF-8",
  CacheControl: `max-age=${DEFAULT_MAX_AGE_SECONDS}`
}).promise()
```

With:
```typescript
const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey, sessionToken }
})
const publicPath = client.getPublicS3Path(resource, FILENAME)

await s3.send(new PutObjectCommand({
  Bucket: bucket,
  Key: publicPath,
  Body: fileContent,
  ContentType: "text/html",
  ContentEncoding: "UTF-8",
  CacheControl: `max-age=${DEFAULT_MAX_AGE_SECONDS}`
}))
```

**Step 5: Update updateFile function**

Replace lines 68-81:
```typescript
const s3 = new S3({ region, accessKeyId, secretAccessKey, sessionToken })
const publicPath = client.getPublicS3Path(resource, FILENAME)

await s3.upload({
  Bucket: bucket,
  Key: publicPath,
  Body: newFileContent,
  ContentType: "text/html",
  ContentEncoding: "UTF-8",
  CacheControl: `max-age=${DEFAULT_MAX_AGE_SECONDS}`
}).promise()
```

With:
```typescript
const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey, sessionToken }
})
const publicPath = client.getPublicS3Path(resource, FILENAME)

await s3.send(new PutObjectCommand({
  Bucket: bucket,
  Key: publicPath,
  Body: newFileContent,
  ContentType: "text/html",
  ContentEncoding: "UTF-8",
  CacheControl: `max-age=${DEFAULT_MAX_AGE_SECONDS}`
}))
```

**Step 6: Update deleteFile function**

Replace lines 93-101:
```typescript
const s3 = new S3({ region, accessKeyId, secretAccessKey, sessionToken })
const publicPath = client.getPublicS3Path(resource, FILENAME)

await s3.deleteObject({
  Bucket: bucket,
  Key: publicPath,
}).promise()
```

With:
```typescript
const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey, sessionToken }
})
const publicPath = client.getPublicS3Path(resource, FILENAME)

await s3.send(new DeleteObjectCommand({
  Bucket: bucket,
  Key: publicPath
}))
```

**Step 7: Run tests to verify migration**

Run: `npm test -- --testPathPattern=s3-share-provider-token-service-helper`
Expected: All tests pass

**Step 8: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 9: Commit**

```bash
git add src/code/utils/s3-share-provider-token-service-helper.ts src/code/utils/s3-share-provider-token-service-helper.test.ts
git commit -m "refactor: migrate AWS SDK v2 to v3 for S3 operations"
```

---

## Task 6: Remove AWS SDK v2

**Files:**
- Modify: `package.json`

**Step 1: Uninstall AWS SDK v2**

Run: `npm uninstall aws-sdk`
Expected: Package removed successfully

**Step 2: Verify no remaining imports of aws-sdk**

Run: `grep -r "from ['\"]aws-sdk" src/`
Expected: No matches found

**Step 3: Verify build works**

Run: `npm run build`
Expected: Build completes without errors

**Step 4: Verify library build works**

Run: `npm run build:library`
Expected: Both CJS and ESM builds complete without errors

**Step 5: Verify tests pass**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: remove deprecated AWS SDK v2"
```

---

## Task 7: Update Type Definition Packages

**Files:**
- Modify: `package.json`

**Step 1: Update @types packages to latest**

Run:
```bash
npm update @types/jest @types/jiff @types/jquery @types/lodash @types/node @types/pako @types/react @types/react-dom @types/react-dom-factories @types/file-saver @types/mime
```

Expected: Packages update to latest compatible versions

**Step 2: Verify build works**

Run: `npm run build`
Expected: Build completes without errors

**Step 3: Verify tests pass**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: update @types packages to latest versions"
```

---

## Task 8: Update Other Safe Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Update minor/patch versions of safe dependencies**

Run:
```bash
npm update classnames lodash pako diff dotenv-webpack eslint-plugin-react
```

Expected: Packages update to latest compatible versions

**Step 2: Verify build works**

Run: `npm run build`
Expected: Build completes without errors

**Step 3: Verify library build works**

Run: `npm run build:library`
Expected: Both CJS and ESM builds complete without errors

**Step 4: Verify tests pass**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: update dependencies to latest compatible versions"
```

---

## Task 9: Final Verification and PR

**Step 1: Run full build**

Run: `npm run build:production`
Expected: Production build completes without errors

**Step 2: Run library build**

Run: `npm run build:library`
Expected: Both CJS and ESM builds complete without errors

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Run linter**

Run: `npm run lint`
Expected: No new lint errors

**Step 5: Test example app manually**

Run: `npm start`
Navigate to: `http://localhost:8080/examples/`
Expected: Example app loads and functions correctly

**Step 6: Push branch and create PR**

```bash
git push -u origin CFM-7-project-modernization
```

Create PR with:
- Title: `CFM-7: Phase 1 - Foundation (TypeScript ES2020, AWS SDK v3)`
- Description: Summary of changes, link to Jira story
- Request Copilot review

---

## Summary

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Update base tsconfig to ES2020 | `build: update base tsconfig to target ES2020` |
| 2 | Update library tsconfig to ES2020 | `build: update library tsconfig to target ES2020` |
| 3 | Install AWS SDK v3 | `build: add AWS SDK v3 S3 client` |
| 4 | Add tests for S3 helper functions | `test: add tests for S3 helper createFile, updateFile, deleteFile` |
| 5 | Migrate AWS SDK usage | `refactor: migrate AWS SDK v2 to v3 for S3 operations` |
| 6 | Remove AWS SDK v2 | `build: remove deprecated AWS SDK v2` |
| 7 | Update @types packages | `build: update @types packages to latest versions` |
| 8 | Update other dependencies | `build: update dependencies to latest compatible versions` |
| 9 | Final verification and PR | (no commit, PR creation) |
