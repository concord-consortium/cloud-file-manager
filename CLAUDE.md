# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloud File Manager (CFM) is a JavaScript/TypeScript library that provides cloud file management for web applications. It wraps apps (primarily CODAP) in an iframe with a menu bar and file dialogs, enabling save/load from multiple cloud storage providers through a consistent API.

## Common Commands

```bash
npm install          # Install dependencies
npm run build        # Development build
npm run build:production  # Production build
npm start            # Dev server at http://localhost:8080/examples/

npm test             # Run Jest unit tests
npm run test:watch   # Jest in watch mode
npm run test:coverage # Jest with coverage report
npx jest path/to/file.test.ts  # Run a single test file

npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix

npm run strings:build  # Compile en-US-master.json → en-US.json (strip comments)
```

Cypress E2E tests: `npm run test:local` (opens Cypress UI; tests in `cypress/integration/`).

## Architecture

### Provider Pattern

The core architecture is a **provider pattern** where storage backends implement `ProviderInterface` (`src/code/providers/provider-interface.ts`). Providers handle authorize/list/load/save/remove/rename operations for their storage backend.

Key providers: `GoogleDriveProvider` (v3 API), `LocalStorageProvider`, `LocalFileProvider`, `S3Provider`, `InteractiveApiProvider`, `DocumentStoreProvider` (deprecated), `URLProvider`, `ReadOnlyProvider`.

### Core Classes

- **`CloudFileManager`** (`src/code/app.tsx`) — Entry point. Creates iframe wrapper or library-mode integration via `createFrame()` or `init()`/`clientConnect()`.
- **`CloudFileManagerClient`** (`src/code/client.ts`) — Central orchestrator (~1400 lines). Manages state (dirty flag, current document, metadata), coordinates providers, handles save/load/share/autosave, processes URL parameters.
- **`CloudFileManagerUI`** (`src/code/ui.ts`) — Connects client state to React views. Manages menu configuration and dialog rendering.

### UI Layer

React components in `src/code/views/`:
- `AppView` — Top-level component rendering menu bar, dialogs, and iframe
- `BannerView` — Dismissible announcement banner
- `MenuBarView` — File menu and status display
- Various dialog components for open/save/share/rename

### Client-App Communication

When iframing, CFM communicates with the wrapped app via `iframe-phone` (postMessage). The client emits `CloudFileManagerClientEvent` events that the host app can listen to.

### Globals Bundle

Third-party libraries (React, ReactDOM, lodash, jQuery, createReactClass) are bundled separately in `globals.js`. The main `app.js` bundle references these as webpack externals. Both scripts must be loaded on the page.

### Build System

Webpack 4 with three entry points:
1. `js/app.js` — Main CFM application
2. `js/globals.js` — Third-party libraries bundle
3. `autolaunch/autolaunch.js` — CODAP autolaunch functionality

Special `codap=1` env var creates CODAP-specific builds that output to sibling `codap` repo.

## Code Conventions

- **No semicolons** — enforced by ESLint (`"semi": ["warn", "never"]`)
- **TypeScript** targeting ES5 with CommonJS modules
- **File naming**: kebab-case (`google-drive-provider.ts`)
- **Interfaces**: `I` prefix (`IClientState`)
- **Private methods**: underscore prefix (`_wrapIfNeeded`)
- **Legacy patterns**: Codebase was converted from CoffeeScript via bulk-decaffeinate. Uses `createReactClass` and `react-dom-factories` in older components; newer components use standard JSX class/function components.
- **Test files**: `*.test.ts` / `*.test.tsx` colocated with source in `src/code/`

## Internationalization

Master English strings: `src/code/utils/lang/en-US-master.json` (supports JS-style comments).
After editing, run `npm run strings:build` to generate `en-US.json`.
Translations managed via POEditor; use `strings:push`/`strings:pull` scripts.
Usage: `import tr from './utils/translate'; tr("~MENU.SAVE")`

## Deployment

GitHub Actions CI builds and deploys to S3 on every push:
- Branches → `https://cloud-file-manager.concord.org/branch/<name>/`
- Tags → `https://cloud-file-manager.concord.org/version/<name>/`
- Production releases via manual GitHub Actions workflow
