# CFM-7: Project Modernization Design

## Overview

This document outlines the plan for modernizing the Cloud File Manager (CFM) codebase. The project was originally written in CoffeeScript and bulk-converted to TypeScript. This modernization addresses technical debt and brings the codebase up to current standards.

## Scope

**Included:**
- TypeScript configuration modernization (ES2020+, incremental strict mode)
- AWS SDK v2 → v3 migration
- Eliminate `any` types left by bulk-decaffeinate
- Address decaffeinate suggestions
- Convert `createReactClass` components to functional components with hooks
- Convert `ReactDOMFactories` to JSX
- Add tests for components before conversion
- Update dependencies (minor/patch versions, type packages)

**Deferred to separate story:**
- ESLint 9 migration with flat config

## Constraints

- Maintain React peer dependency of `>=16.14` for broader client compatibility
- CODAP v3 is the primary consumer (on React 18)
- Other clients (e.g., SageModeler) use the 1.9.x branch, not affected by this work

## Current State

- **29 files** with `decaffeinate suggestions` comments
- **23 files** using `createReactClass`
- **326 occurrences** of explicit `: any` types across 45 files
- TypeScript config targeting ES5 with minimal strict settings
- AWS SDK v2 usage in one file (`s3-share-provider-token-service-helper.ts`)

---

## Phase 1: Foundation (TypeScript & Dependencies)

### TypeScript Configuration Updates

The project has multiple tsconfig files:

```
tsconfig.json (base)
    └── tsconfig-lib.json (extends base, library settings)
            ├── tsconfig-cjs.json (CommonJS → dist/cjs)
            └── tsconfig-esm.json (ES2020 module → dist/esm)
```

**Updates to `tsconfig.json` (base):**
- `target`: ES5 → ES2020
- Update `module`/`moduleResolution` for modern Node
- Strict flags will be added incrementally in Phase 2

**Updates to `tsconfig-lib.json`:**
- `target`: ES2018 → ES2020 (aligns with ESM module setting)
- Keeps `declaration: true` for type definitions

**`tsconfig-cjs.json` / `tsconfig-esm.json`:**
- Minimal changes needed (they just override output directory and module format)

### Dependency Updates

- AWS SDK: `aws-sdk` → `@aws-sdk/client-s3`
- Update `@types/*` packages to latest
- Update `typescript` to latest 5.x
- Update other safe minor/patch versions

### AWS SDK Migration

Single file change in `src/code/utils/s3-share-provider-token-service-helper.ts`:

```typescript
// Before (v2)
import S3 from "aws-sdk/clients/s3"
const s3 = new S3({ region, accessKeyId, secretAccessKey, sessionToken })
await s3.upload({ Bucket, Key, Body, ... }).promise()
await s3.deleteObject({ Bucket, Key }).promise()

// After (v3)
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey, sessionToken } })
await s3.send(new PutObjectCommand({ Bucket, Key, Body, ... }))
await s3.send(new DeleteObjectCommand({ Bucket, Key }))
```

### Verification

- `npm run build` (webpack) works
- `npm run build:library` (CJS + ESM) works
- `npm test` passes
- Example apps function correctly

---

## Phase 2: TypeScript Strictness (Incremental)

Enable strict flags one at a time, fixing errors after each:

### Step 2.1: `strictNullChecks` (highest impact)
- Catches null/undefined errors at compile time
- Expect the most errors here
- Fix with null checks, optional chaining (`?.`), nullish coalescing (`??`)

### Step 2.2: `noImplicitThis`
- Errors when `this` has implicit `any` type
- Relevant for `createReactClass` components

### Step 2.3: `strictBindCallApply`
- Type-checks `bind()`, `call()`, `apply()` methods
- Usually low error count

### Step 2.4: `strictFunctionTypes`
- Stricter checking of function parameter types

### Step 2.5: `strictPropertyInitialization`
- Ensures class properties are initialized

### Step 2.6: Full `strict: true`
- Consolidate to `strict: true`, remove individual flags

**Decaffeinate cleanup:** As we touch files to fix strict errors, also address `decaffeinate suggestions` comments in those files.

---

## Phase 3: Type Improvements

Eliminate ~326 explicit `any` types, prioritized by file category:

### Step 3.1: Utility files (lowest risk)
- `src/code/utils/*.ts` - Small, focused functions
- Easy to properly type

### Step 3.2: Provider interfaces
- ~15 `any`s in `provider-interface.ts`
- Define proper types for provider methods, callbacks, metadata
- Types cascade to all provider implementations

### Step 3.3: Provider implementations
- `google-drive-provider.ts` (28 `any`s)
- `legacy-google-drive-provider.ts` (27 `any`s)
- `document-store-provider.ts` (13 `any`s)
- `lara-provider.ts` (16 `any`s)
- Other providers

### Step 3.4: Core client
- `client.ts` (67 `any`s) - Largest file
- Type public API surface first, then internals

### Step 3.5: UI layer
- `ui.ts`, view components
- Overlaps with Phase 4 (some typing happens during component conversion)

**Note:** We won't chase 100% elimination if some `any`s are genuinely needed (e.g., third-party API responses without types).

---

## Phase 4: React Modernization

Convert 23 `createReactClass` components to functional components with hooks.

### Approach

For each component:
1. Write tests for current behavior
2. Convert to functional component with hooks
3. Convert ReactDOMFactories to JSX
4. Rename `.ts` → `.tsx`
5. Verify tests still pass

### Conversion Pattern

```typescript
// Before: createReactClass with ReactDOMFactories
import createReactClass from "create-react-class"
import ReactDOMFactories from "react-dom-factories"
const {div, span} = ReactDOMFactories

export default createReactClass({
  displayName: 'MyComponent',
  getInitialState() { return { foo: 1 } },
  componentDidMount() { /* ... */ },
  render() { return div({className: 'bar'}, this.state.foo) }
})

// After: Functional component with hooks and JSX
import React, { useState, useEffect } from "react"

export default function MyComponent(props: MyComponentProps) {
  const [foo, setFoo] = useState(1)
  useEffect(() => { /* ... */ }, [])
  return <div className="bar">{foo}</div>
}
```

### Conversion Order (simple → complex)

**1. Leaf components first:**
- `alert-dialog-view.ts`
- `confirm-dialog-view.ts`
- `rename-dialog-view.ts`
- `blocking-modal-view.ts`
- `download-dialog-view.ts`
- `url-tab-view.ts`

**2. Mid-level components:**
- `dropdown-view.ts`
- `tabbed-panel-view.ts`
- `file-dialog-tab-view.ts`
- `local-file-tab-list-view.ts`
- `local-file-tab-save-view.ts`
- `select-provider-dialog-tab-view.ts`
- `authorize-mixin.ts`

**3. Complex/container components:**
- `menu-bar-view.ts`
- `modal-tabbed-dialog-view.ts`
- `provider-tabbed-dialog-view.ts`
- `import-tabbed-dialog-view.ts`
- `app-view.tsx`

**Provider components:**
- `google-drive-provider.ts`
- `legacy-google-drive-provider.ts`
- `document-store-provider.ts`

---

## Phase 5: Cleanup & Finalization

### Step 5.1: Remove obsolete dependencies
- `create-react-class`
- `react-dom-factories`
- `@types/create-react-class`
- `@types/react-dom-factories`

### Step 5.2: Remove helper code
- `src/code/create-react-factory.ts`
- Clean up imports across the codebase

### Step 5.3: Final lint pass
- Run `npm run lint:fix`
- Address any new warnings

### Step 5.4: Verify all build targets
- `npm run build` - Development webpack build
- `npm run build:production` - Production webpack build
- `npm run build:library` - CJS + ESM npm library builds
- `npm test` - All tests pass
- Manual testing of example apps

### Step 5.5: Update package.json
- Bump version appropriately
- Ensure `peerDependencies` still reflect `react: ">=16.14"`

### Step 5.6: Documentation
- Update any relevant documentation if APIs changed

---

## Related Stories

- **ESLint 9 migration** (deferred): Upgrade to ESLint 9 with flat config, remove `eslint-plugin-babel`
