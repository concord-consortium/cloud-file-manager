# Implementation: CODAP V2 Should Show V3 Banner

## Overview

This document describes how to implement the banner feature defined in [requirements.md](requirements.md). The implementation adds a configurable announcement banner above the CFM menu bar, fetched from a remote JSON endpoint.

## Architecture

CFM supports two integration modes:

1. **Iframe wrapper mode** (`usingIframe: true`): CFM wraps the client app in an iframe
2. **Library mode** (`appOrMenuElemId` only): CFM renders only its menu bar into a container

**Both CODAP v2 and v3 use library mode.** In CODAP v2, the CFM menu bar renders inside CODAP's nav bar structure (`<div class="view"><div class="menu-bar">...</div></div>`). The banner will be inserted above the menu bar within this container.

```
┌─────────────────────────────────────────────────────────────┐
│  CFMAppOptions.banner (URL)                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  AppView.componentDidMount()                                │
│  - Check iframe context (window.self !== window.top)        │
│  - Fetch JSON from URL                                      │
│  - Validate JSON schema                                     │
│  - Check enabled, dates, localStorage dismissal             │
│  - Set state.bannerConfig if all checks pass                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  AppView.render()                                           │
│  - Render <BannerView> above <MenuBar> if bannerConfig set  │
│  - Works in both iframe wrapper mode and library mode       │
└─────────────────────────────────────────────────────────────┘
```

**Note on iframe check**: The `window.self !== window.top` check prevents the banner from appearing when the entire application (CFM + client) is embedded in an external iframe (e.g., LMS, curriculum page). This is separate from the `usingIframe` option which controls whether CFM wraps its client app internally.

## Files to Modify

| File | Changes |
|------|---------|
| `src/code/app-options.ts` | Add `banner?: string` to `CFMAppOptions` |
| `src/code/views/app-view.tsx` | Add banner state, fetch logic, render `<BannerView>` |
| `src/style/app.styl` | Import new banner styles |

## Files to Create

| File | Purpose |
|------|---------|
| `src/code/views/banner-view.tsx` | Banner React component |
| `src/code/utils/banner-utils.ts` | Banner config fetching, validation, and condition checking |
| `src/style/components/banner.styl` | Banner styles |
| `src/assets/examples/banner.html` | Example page demonstrating the banner feature |
| `src/assets/examples/banner.json` | Test banner configuration for the example |

## Files to Update

| File | Changes |
|------|---------|
| `src/assets/examples/index.html` | Add link to banner example |

## Implementation Details

### 1. App Options (`src/code/app-options.ts`)

Add the `banner` option to `CFMAppOptions`:

```typescript
export interface CFMAppOptions {
  // ... existing options ...

  /**
   * URL to a JSON file containing banner configuration.
   * If provided, CFM will fetch and display the banner above the menu bar.
   * Must be an absolute HTTPS URL or a same-origin relative URL.
   */
  banner?: string
}
```

### 2. Banner Utilities (`src/code/utils/banner-utils.ts`)

Create a new utility module for banner-related logic:

```typescript
/**
 * Banner configuration schema (from remote JSON)
 */
export interface BannerConfig {
  message: string
  id: string
  buttonText?: string
  buttonUrl?: string
  buttonTarget?: string
  enabled?: boolean
  startDate?: number
  endDate?: number
  backgroundColor?: string
  textColor?: string
}

/**
 * Check if running inside an iframe.
 * Wrapped in try/catch for cross-origin SecurityError.
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top
  } catch {
    // Cross-origin iframe - treat as "in iframe"
    return true
  }
}

/**
 * Check if banner was previously dismissed via localStorage.
 */
export function isBannerDismissed(id: string): boolean {
  try {
    return localStorage.getItem(`cfm-banner-dismissed-${id}`) === 'true'
  } catch {
    // localStorage unavailable
    return false
  }
}

/**
 * Persist banner dismissal to localStorage.
 */
export function dismissBanner(id: string): void {
  try {
    localStorage.setItem(`cfm-banner-dismissed-${id}`, 'true')
  } catch {
    // localStorage unavailable - dismissal won't persist
  }
}

/**
 * Validate that buttonUrl uses https:// protocol.
 */
export function isValidButtonUrl(url: string | undefined): boolean {
  if (!url) return false
  return url.startsWith('https://')
}

/**
 * Validate CSS color value to prevent CSS injection.
 * Allows: hex (#rgb, #rrggbb, #rrggbbaa), rgb(), rgba(), and named colors.
 */
export function isValidCssColor(value: string | undefined): boolean {
  if (!value) return false
  return /^#[0-9a-fA-F]{3,8}$/.test(value) ||
         /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(value) ||
         /^[a-zA-Z]+$/.test(value)
}

/**
 * Check if current time is within the banner's date range.
 */
export function isWithinDateRange(config: BannerConfig): boolean {
  const now = Date.now()
  const { startDate, endDate } = config

  // Invalid range: startDate > endDate
  if (startDate !== undefined && endDate !== undefined && startDate > endDate) {
    return false
  }

  if (startDate !== undefined && now < startDate) {
    return false
  }

  if (endDate !== undefined && now > endDate) {
    return false
  }

  return true
}

/**
 * Validate banner JSON has required fields.
 */
export function isValidBannerConfig(data: unknown): data is BannerConfig {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return typeof obj.message === 'string' &&
         obj.message.length > 0 &&
         typeof obj.id === 'string' &&
         obj.id.length > 0
}

/**
 * Fetch and validate banner configuration.
 * Returns null if fetch fails, JSON is invalid, or banner should not be shown.
 *
 * Note: The fetch happens before checking dismissal because we don't know the
 * banner `id` until we fetch the JSON. This is an acceptable trade-off since
 * the JSON is small and browser-cached.
 */
export async function fetchBannerConfig(url: string): Promise<BannerConfig | null> {
  // Check iframe context first (no need to fetch if in iframe)
  if (isInIframe()) {
    return null
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // Validate schema
    if (!isValidBannerConfig(data)) {
      return null
    }

    // Check enabled flag
    if (data.enabled === false) {
      return null
    }

    // Check date range
    if (!isWithinDateRange(data)) {
      return null
    }

    // Check dismissal
    if (isBannerDismissed(data.id)) {
      return null
    }

    return data
  } catch {
    // Fetch error, JSON parse error, etc. - silent failure
    return null
  }
}
```

### 3. Banner View Component (`src/code/views/banner-view.tsx`)

Create a functional React component:

```typescript
import React from 'react'
import { BannerConfig, dismissBanner, isValidButtonUrl, isValidCssColor } from '../utils/banner-utils'

interface IBannerViewProps {
  config: BannerConfig
  onDismiss: () => void
}

/**
 * Stateless banner component - visibility is controlled by parent via onDismiss.
 */
export const BannerView: React.FC<IBannerViewProps> = ({ config, onDismiss }) => {
  const {
    message,
    id,
    buttonText = 'Learn More',
    buttonUrl,
    buttonTarget = '_blank',
    backgroundColor,
    textColor
  } = config

  const showButton = isValidButtonUrl(buttonUrl)

  const handleClose = () => {
    onDismiss()
  }

  const handleDontShowAgain = () => {
    dismissBanner(id)
    onDismiss()
  }

  // Validate colors to prevent CSS injection
  const customStyles: React.CSSProperties = {}
  if (isValidCssColor(backgroundColor)) customStyles.backgroundColor = backgroundColor
  if (isValidCssColor(textColor)) customStyles.color = textColor

  return (
    <div
      className="cfm-banner"
      role="status"
      aria-label="Announcement"
      style={customStyles}
      data-testid="cfm-banner"
    >
      <span className="cfm-banner-message">{message}</span>

      <div className="cfm-banner-actions">
        {showButton && (
          <a
            href={buttonUrl}
            target={buttonTarget}
            rel="noopener noreferrer"
            className="cfm-banner-button"
            data-testid="cfm-banner-button"
          >
            {buttonText}
          </a>
        )}

        <button
          type="button"
          className="cfm-banner-dont-show"
          onClick={handleDontShowAgain}
          data-testid="cfm-banner-dont-show"
        >
          Don't show again
        </button>

        <button
          type="button"
          className="cfm-banner-close"
          onClick={handleClose}
          aria-label="Close announcement"
          data-testid="cfm-banner-close"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
```

### 4. AppView Integration (`src/code/views/app-view.tsx`)

Modify the AppView component:

**Add to imports:**
```typescript
import { BannerView } from './banner-view'
import { BannerConfig, fetchBannerConfig } from '../utils/banner-utils'
```

**Add to IAppViewState:**
```typescript
interface IAppViewState {
  // ... existing state ...
  bannerConfig: BannerConfig | null
}
```

**Initialize in constructor:**
```typescript
this.state = {
  // ... existing state ...
  bannerConfig: null
}
```

**Add mounted flag and banner fetch in componentDidMount:**
```typescript
private _isMounted = false

componentDidMount() {
  this._isMounted = true
  // ... existing code ...

  // Fetch banner config if URL provided
  const bannerUrl = this.props.client?.appOptions?.banner
  if (bannerUrl) {
    fetchBannerConfig(bannerUrl).then(config => {
      // Guard against setState on unmounted component
      if (this._isMounted && config) {
        this.setState({ bannerConfig: config })
      }
    })
  }
}

componentWillUnmount() {
  this._isMounted = false
  // ... existing cleanup ...
}
```

**Add banner rendering in render() before MenuBar:**
```typescript
render() {
  const { bannerConfig } = this.state

  return (
    <div className={this.props.usingIframe ? 'app' : 'view'}>
      {bannerConfig && (
        <BannerView
          config={bannerConfig}
          onDismiss={() => this.setState({ bannerConfig: null })}
        />
      )}
      <MenuBar ... />
      {/* ... rest of render ... */}
    </div>
  )
}
```

### 5. Banner Styles (`src/style/components/banner.styl`)

Create banner styles following existing conventions:

```stylus
@import '../mixins/default'
@import '../mixins/metrics'

.cfm-banner
  display: flex
  align-items: center
  justify-content: space-between
  padding: 10px 16px
  background-color: #1a73e8
  color: #ffffff
  font-family: Arial, sans-serif
  font-size: 14px
  gap: 16px

  .cfm-banner-message
    flex: 1
    line-height: 1.4

  .cfm-banner-actions
    display: flex
    align-items: center
    gap: 12px
    flex-shrink: 0

  .cfm-banner-button
    background-color: #ffffff
    color: #1a73e8
    padding: 6px 12px
    border-radius: 4px
    text-decoration: none
    font-weight: 500
    font-size: 13px
    white-space: nowrap

    &:hover
      background-color: #f1f3f4

    &:focus
      outline: 2px solid #ffffff
      outline-offset: 2px

  .cfm-banner-dont-show
    background: transparent
    border: 1px solid rgba(255, 255, 255, 0.6)
    color: #ffffff
    padding: 5px 10px
    border-radius: 4px
    cursor: pointer
    font-size: 12px
    white-space: nowrap

    &:hover
      background-color: rgba(255, 255, 255, 0.1)
      border-color: #ffffff

    &:focus
      outline: 2px solid #ffffff
      outline-offset: 2px

  .cfm-banner-close
    background: transparent
    border: none
    color: #ffffff
    font-size: 20px
    line-height: 1
    padding: 4px 8px
    cursor: pointer
    opacity: 0.8

    &:hover
      opacity: 1

    &:focus
      outline: 2px solid #ffffff
      outline-offset: 2px
```

**Update `src/style/app.styl`:**
```stylus
@import 'components/banner'
```

## Testing

### Unit Tests (`src/code/utils/banner-utils.test.ts`)

Test the utility functions:

```typescript
import {
  isInIframe,
  isBannerDismissed,
  dismissBanner,
  isValidButtonUrl,
  isWithinDateRange,
  isValidBannerConfig,
  fetchBannerConfig
} from './banner-utils'

describe('banner-utils', () => {
  describe('isValidButtonUrl', () => {
    it('returns true for https URLs', () => {
      expect(isValidButtonUrl('https://example.com')).toBe(true)
      expect(isValidButtonUrl('https://example.com/path#hash')).toBe(true)
    })

    it('returns false for non-https URLs', () => {
      expect(isValidButtonUrl('http://example.com')).toBe(false)
      expect(isValidButtonUrl('javascript:alert(1)')).toBe(false)
      expect(isValidButtonUrl('data:text/html,...')).toBe(false)
      expect(isValidButtonUrl(undefined)).toBe(false)
    })
  })

  describe('isWithinDateRange', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-06-15T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('returns true when no dates specified', () => {
      expect(isWithinDateRange({ message: 'test', id: '1' })).toBe(true)
    })

    it('returns true when within range', () => {
      const config = {
        message: 'test',
        id: '1',
        startDate: new Date('2024-01-01').getTime(),
        endDate: new Date('2024-12-31').getTime()
      }
      expect(isWithinDateRange(config)).toBe(true)
    })

    it('returns false when before startDate', () => {
      const config = {
        message: 'test',
        id: '1',
        startDate: new Date('2024-07-01').getTime()
      }
      expect(isWithinDateRange(config)).toBe(false)
    })

    it('returns false when after endDate', () => {
      const config = {
        message: 'test',
        id: '1',
        endDate: new Date('2024-01-01').getTime()
      }
      expect(isWithinDateRange(config)).toBe(false)
    })

    it('returns false when startDate > endDate (invalid range)', () => {
      const config = {
        message: 'test',
        id: '1',
        startDate: new Date('2024-12-31').getTime(),
        endDate: new Date('2024-01-01').getTime()
      }
      expect(isWithinDateRange(config)).toBe(false)
    })
  })

  describe('isValidBannerConfig', () => {
    it('returns true for valid config', () => {
      expect(isValidBannerConfig({ message: 'Hello', id: 'test-1' })).toBe(true)
    })

    it('returns false for missing message', () => {
      expect(isValidBannerConfig({ id: 'test-1' })).toBe(false)
    })

    it('returns false for missing id', () => {
      expect(isValidBannerConfig({ message: 'Hello' })).toBe(false)
    })

    it('returns false for empty strings', () => {
      expect(isValidBannerConfig({ message: '', id: 'test' })).toBe(false)
      expect(isValidBannerConfig({ message: 'Hello', id: '' })).toBe(false)
    })

    it('returns false for non-objects', () => {
      expect(isValidBannerConfig(null)).toBe(false)
      expect(isValidBannerConfig('string')).toBe(false)
      expect(isValidBannerConfig(123)).toBe(false)
    })
  })

  describe('localStorage functions', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('dismissBanner stores dismissal', () => {
      dismissBanner('test-id')
      expect(localStorage.getItem('cfm-banner-dismissed-test-id')).toBe('true')
    })

    it('isBannerDismissed returns true after dismissal', () => {
      expect(isBannerDismissed('test-id')).toBe(false)
      dismissBanner('test-id')
      expect(isBannerDismissed('test-id')).toBe(true)
    })
  })
})
```

### Component Tests (`src/code/views/banner-view.test.tsx`)

Test the React component:

```typescript
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BannerView } from './banner-view'
import * as bannerUtils from '../utils/banner-utils'

describe('BannerView', () => {
  const defaultConfig = {
    message: 'Test banner message',
    id: 'test-banner-1',
    buttonText: 'Click Me',
    buttonUrl: 'https://example.com',
    buttonTarget: '_blank'
  }

  const mockOnDismiss = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders banner with message', () => {
    render(<BannerView config={defaultConfig} onDismiss={mockOnDismiss} />)
    expect(screen.getByText('Test banner message')).toBeInTheDocument()
  })

  it('renders action button when buttonUrl is valid https', () => {
    render(<BannerView config={defaultConfig} onDismiss={mockOnDismiss} />)
    const button = screen.getByTestId('cfm-banner-button')
    expect(button).toHaveAttribute('href', 'https://example.com')
    expect(button).toHaveAttribute('target', '_blank')
    expect(button).toHaveAttribute('rel', 'noopener noreferrer')
    expect(button).toHaveTextContent('Click Me')
  })

  it('does not render button when buttonUrl is missing', () => {
    const config = { ...defaultConfig, buttonUrl: undefined }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    expect(screen.queryByTestId('cfm-banner-button')).not.toBeInTheDocument()
  })

  it('does not render button when buttonUrl is not https', () => {
    const config = { ...defaultConfig, buttonUrl: 'http://example.com' }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    expect(screen.queryByTestId('cfm-banner-button')).not.toBeInTheDocument()
  })

  it('uses default button text when not provided', () => {
    const config = { ...defaultConfig, buttonText: undefined }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    expect(screen.getByTestId('cfm-banner-button')).toHaveTextContent('Learn More')
  })

  it('uses custom buttonTarget', () => {
    const config = { ...defaultConfig, buttonTarget: 'codap3' }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    expect(screen.getByTestId('cfm-banner-button')).toHaveAttribute('target', 'codap3')
  })

  it('hides banner when close button clicked', () => {
    render(<BannerView config={defaultConfig} onDismiss={mockOnDismiss} />)
    fireEvent.click(screen.getByTestId('cfm-banner-close'))
    expect(screen.queryByTestId('cfm-banner')).not.toBeInTheDocument()
    expect(mockOnDismiss).toHaveBeenCalled()
  })

  it('persists dismissal when "Don\'t show again" clicked', () => {
    const dismissSpy = jest.spyOn(bannerUtils, 'dismissBanner')
    render(<BannerView config={defaultConfig} onDismiss={mockOnDismiss} />)
    fireEvent.click(screen.getByTestId('cfm-banner-dont-show'))
    expect(dismissSpy).toHaveBeenCalledWith('test-banner-1')
    expect(screen.queryByTestId('cfm-banner')).not.toBeInTheDocument()
    expect(mockOnDismiss).toHaveBeenCalled()
  })

  it('applies custom colors', () => {
    const config = {
      ...defaultConfig,
      backgroundColor: '#ff0000',
      textColor: '#00ff00'
    }
    render(<BannerView config={config} onDismiss={mockOnDismiss} />)
    const banner = screen.getByTestId('cfm-banner')
    expect(banner).toHaveStyle({ backgroundColor: '#ff0000', color: '#00ff00' })
  })

  it('has correct ARIA attributes', () => {
    render(<BannerView config={defaultConfig} onDismiss={mockOnDismiss} />)
    const banner = screen.getByTestId('cfm-banner')
    expect(banner).toHaveAttribute('role', 'status')
    expect(banner).toHaveAttribute('aria-label', 'Announcement')
  })
})
```

### Integration Test

Test the full flow in `src/code/views/app-view.test.tsx`:

```typescript
describe('AppView banner integration', () => {
  it('fetches and displays banner when URL provided', async () => {
    const bannerConfig = {
      message: 'CODAP 3 is available!',
      id: 'codap3-test',
      buttonUrl: 'https://codap3.concord.org',
      buttonText: 'Try it'
    }

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(bannerConfig)
    })

    // Render AppView with banner URL in options
    // Assert banner appears with correct content
  })

  it('does not show banner when in iframe', async () => {
    // Mock window.self !== window.top
    // Assert fetch is not called and banner not shown
  })

  it('does not show banner when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
    // Assert no banner shown, no error thrown
  })
})
```

## Client App Integration

### CODAP v2 (Primary Target)

CODAP v2 uses CFM in **library mode** (`className="view"`). CFM renders its menu bar into CODAP's nav bar structure:

```html
<!-- CODAP v2 DOM structure -->
<div id="sc2167" class="leftSide">
  <div class="view">           <!-- CFM's container (library mode) -->
    <div class="menu-bar">     <!-- CFM's menu bar -->
      ...
    </div>
  </div>
</div>
```

The `banner` option would be added to CODAP v2's CFM initialization. The banner will render above the menu bar within the `.view` container.

### CODAP v3

CODAP v3 also uses **library mode** via `useCloudFileManager` hook. While V3 wouldn't typically need a "try V3" banner, the implementation works identically.

### SageModeler (No Banner)

SageModeler uses CFM in **iframe wrapper mode** (`className="app"` with `<iframe>` wrapping CODAP):

```html
<!-- SageModeler DOM structure -->
<div class="app">              <!-- CFM's container (iframe mode) -->
  <div class="menu-bar">...</div>
  <div class="innerApp">
    <iframe src="...codap..."></iframe>  <!-- Embedded CODAP -->
  </div>
</div>
```

SageModeler **will not include the `banner` option** in their CFM configuration, so no banner will appear. This is the opt-in model - apps that don't want the banner simply omit the option.

## Development Workflow

### Example Files

Create example files to demonstrate and test the banner feature. Examples are served at `http://localhost:8080/examples/` during development.

#### 1. Create banner JSON file (`src/assets/examples/banner.json`)

```json
{
  "message": "CODAP 3 is now available! Try the new version with improved features and better performance.",
  "id": "codap3-example-1",
  "buttonText": "Try CODAP 3",
  "buttonUrl": "https://codap3.concord.org",
  "buttonTarget": "_blank",
  "enabled": true,
  "backgroundColor": "#1a73e8",
  "textColor": "#ffffff"
}
```

#### 2. Create banner example page (`src/assets/examples/banner.html`)

```html
<html>
  <head>
    <script src="../js/globals.js"></script>
    <script src="../js/app.js"></script>
    <link rel="stylesheet" href="../css/app.css">
    <title>Examples: Banner</title>
  </head>
  <body>
    <div id="wrapper">
    </div>
    <script>
      var options = {
        app: "example-app/index.html",
        mimeType: "text/plain",
        appName: "CFM_Demo",
        appVersion: "0.1",
        appBuildNum: "1",
        banner: "banner.json",
        providers: [
          "localStorage",
          "localFile"
        ],
        ui: {
          menu: CloudFileManager.DefaultMenu,
          menuBar: {
            info: "Banner Example"
          }
        }
      };
      CloudFileManager.createFrame(options, "wrapper");
    </script>
  </body>
</html>
```

#### 3. Update examples index (`src/assets/examples/index.html`)

Add the new example link to the list:

```html
<li><a href="banner.html">Banner (announcement above menu bar)</a></li>
```

#### 4. Optional: Create banner-disabled example (`src/assets/examples/banner-disabled.json`)

For testing the `enabled: false` flag:

```json
{
  "message": "This banner should not appear.",
  "id": "disabled-banner-1",
  "enabled": false
}
```

### Local Testing

1. **Start development server**:
   ```bash
   npm start
   ```

2. **Open the banner example**:
   Navigate to `http://localhost:8080/examples/banner.html`

3. **Test scenarios**:
   - Verify banner appears above menu bar
   - Test close button (should hide until reload)
   - Test "Don't show again" (should persist across reloads)
   - Test with different banner JSON configurations
   - Test in iframe context (embed the example in an iframe - should not show)
   - Test with fetch failures (use browser DevTools to block network request)

4. **Clear dismissal for re-testing**:
   In browser DevTools console:
   ```javascript
   localStorage.removeItem('cfm-banner-dismissed-codap3-example-1')
   ```
   Then reload the page.

### Manual Test Checklist

- [ ] Banner appears above menu bar when valid config provided
- [ ] Banner does not appear when `banner` option omitted
- [ ] Banner does not appear in iframe context
- [ ] Banner does not appear when JSON fetch fails
- [ ] Banner does not appear when JSON is malformed
- [ ] Banner does not appear when `enabled: false`
- [ ] Banner does not appear outside date range
- [ ] Banner does not appear when previously dismissed
- [ ] Close button hides banner (session only)
- [ ] "Don't show again" persists dismissal across reloads
- [ ] Action button opens URL in new tab
- [ ] Action button not shown when `buttonUrl` omitted
- [ ] Action button not shown when `buttonUrl` is not HTTPS
- [ ] Custom colors applied correctly
- [ ] Keyboard navigation works (Tab through controls)
- [ ] Screen reader announces banner appropriately

## Estimated File Changes

| File | Lines Added | Lines Modified |
|------|-------------|----------------|
| `src/code/app-options.ts` | ~5 | 0 |
| `src/code/utils/banner-utils.ts` | ~100 | 0 (new file) |
| `src/code/views/banner-view.tsx` | ~80 | 0 (new file) |
| `src/code/views/app-view.tsx` | ~20 | ~5 |
| `src/style/components/banner.styl` | ~80 | 0 (new file) |
| `src/style/app.styl` | 1 | 0 |
| `src/assets/examples/banner.html` | ~35 | 0 (new file) |
| `src/assets/examples/banner.json` | ~10 | 0 (new file) |
| `src/assets/examples/index.html` | 1 | 0 |
| Tests | ~250 | 0 |
| **Total** | **~582** | **~5** |

---

## Addendum: Extended Styling Configuration (2026-02-05)

After initial implementation, additional styling configuration options were added to support banners with custom color schemes.

### New BannerConfig Properties

The `BannerConfig` interface in `src/code/utils/banner-utils.ts` was extended with:

```typescript
export interface BannerConfig {
  // ... existing properties ...
  buttonBackgroundColor?: string  // CSS color for action button background
  buttonTextColor?: string        // CSS color for action button text
  closeButtonColor?: string       // CSS color for close/dismiss buttons (text & border)
  paddingX?: number               // Horizontal banner padding in pixels
  paddingY?: number               // Vertical banner padding in pixels
  buttonPaddingX?: number         // Horizontal button padding in pixels
  buttonPaddingY?: number         // Vertical button padding in pixels
}
```

### BannerView Component Changes

The `BannerView` component (`src/code/views/banner-view.tsx`) was updated to:

1. **Extract new config properties** from the destructured config object
2. **Build style objects** for buttons with custom colors and padding:

```typescript
// Button styles (action button)
const buttonStyles: React.CSSProperties = {}
if (isValidCssColor(buttonBackgroundColor)) buttonStyles.backgroundColor = buttonBackgroundColor
if (isValidCssColor(buttonTextColor)) buttonStyles.color = buttonTextColor
if (typeof buttonPaddingY === 'number' && Number.isFinite(buttonPaddingY) && buttonPaddingY >= 0) {
  buttonStyles.paddingTop = buttonPaddingY
  buttonStyles.paddingBottom = buttonPaddingY
}
if (typeof buttonPaddingX === 'number' && Number.isFinite(buttonPaddingX) && buttonPaddingX >= 0) {
  buttonStyles.paddingLeft = buttonPaddingX
  buttonStyles.paddingRight = buttonPaddingX
}

// Close/dismiss button styles
const closeStyles: React.CSSProperties = {}
if (isValidCssColor(closeButtonColor)) {
  closeStyles.color = closeButtonColor
  closeStyles.borderColor = closeButtonColor
}
// Button padding also applies to "Don't show again" button
if (typeof buttonPaddingY === 'number' && Number.isFinite(buttonPaddingY) && buttonPaddingY >= 0) {
  closeStyles.paddingTop = buttonPaddingY
  closeStyles.paddingBottom = buttonPaddingY
}
if (typeof buttonPaddingX === 'number' && Number.isFinite(buttonPaddingX) && buttonPaddingX >= 0) {
  closeStyles.paddingLeft = buttonPaddingX
  closeStyles.paddingRight = buttonPaddingX
}
```

3. **Apply inline styles** to the button elements via the `style` prop

### CSS Defaults

When the new properties are not specified, the CSS defaults from `banner.styl` apply:

| Property | CSS Default |
|----------|-------------|
| `buttonBackgroundColor` | `#ffffff` |
| `buttonTextColor` | `#1a73e8` |
| `closeButtonColor` | `#ffffff` |
| `paddingX` | `16px` |
| `paddingY` | `10px` |
| `buttonPaddingX` | `12px` (action), `10px` (don't show) |
| `buttonPaddingY` | `6px` (action), `5px` (don't show) |

### Validation

- **Color values**: Validated using `isValidCssColor()` which accepts hex (#rgb, #rrggbb, #rrggbbaa), rgb()/rgba(), and named colors
- **Padding values**: Must be `typeof number`, `Number.isFinite()`, and `>= 0`; invalid values are silently ignored

### New Tests

Added tests in `banner-view.test.tsx`:
- `applies custom button colors when valid`
- `applies custom close button color when valid`
- `does not apply invalid button colors`
- `applies custom padding when valid`
- `does not apply invalid padding values`
- `applies custom button padding when valid`
- `does not apply invalid button padding values`
