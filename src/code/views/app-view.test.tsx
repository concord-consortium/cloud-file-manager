import { act, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import AppView from './app-view'
import * as bannerUtils from '../utils/banner-utils'
import { BannerConfig } from '../utils/banner-utils'

// Mock banner-view to avoid pulling in the full component tree
jest.mock('./banner-view', () => ({
  BannerView: ({ config, onDismiss }: { config: BannerConfig, onDismiss: () => void }) => (
    <div data-testid="mock-banner" data-banner-id={config.id}>
      {config.message}
      <button data-testid="mock-banner-dismiss" onClick={onDismiss}>Dismiss</button>
    </div>
  )
}))

const validConfig: BannerConfig = {
  message: 'Test banner',
  id: 'test-banner-1'
}

/**
 * Create a minimal mock client that satisfies AppView's constructor and lifecycle.
 */
function createMockClient(appOptions: Record<string, any> = {}) {
  return {
    appOptions,
    state: { metadata: null },
    _ui: {
      menu: { items: [] },
      listen: jest.fn()
    },
    listen: jest.fn()
  } as any
}

describe('AppView', () => {
  let originalRaf: typeof requestAnimationFrame

  beforeEach(() => {
    localStorage.clear()
    jest.restoreAllMocks()
    // Replace requestAnimationFrame with synchronous execution for tests
    originalRaf = window.requestAnimationFrame
    window.requestAnimationFrame = (cb: FrameRequestCallback) => { cb(0); return 0 }
  })

  afterEach(() => {
    window.requestAnimationFrame = originalRaf
  })

  describe('banner with direct config object', () => {
    it('renders banner when given a valid BannerConfig object', () => {
      const client = createMockClient({ banner: validConfig })
      render(
        <AppView client={client} appOrMenuElemId="app" />
      )
      expect(screen.getByTestId('mock-banner')).toBeInTheDocument()
      expect(screen.getByText('Test banner')).toBeInTheDocument()
    })

    it('does not render banner when config is disabled', () => {
      const client = createMockClient({ banner: { ...validConfig, enabled: false } })
      render(
        <AppView client={client} appOrMenuElemId="app" />
      )
      expect(screen.queryByTestId('mock-banner')).not.toBeInTheDocument()
    })

    it('does not render banner when config is invalid (missing message)', () => {
      const client = createMockClient({ banner: { id: 'test-1' } })
      render(
        <AppView client={client} appOrMenuElemId="app" />
      )
      expect(screen.queryByTestId('mock-banner')).not.toBeInTheDocument()
    })

    it('does not render banner when previously dismissed', () => {
      bannerUtils.dismissBanner('test-banner-1')
      const client = createMockClient({ banner: validConfig })
      render(
        <AppView client={client} appOrMenuElemId="app" />
      )
      expect(screen.queryByTestId('mock-banner')).not.toBeInTheDocument()
    })

    it('does not render banner when in iframe', () => {
      jest.spyOn(bannerUtils, 'isInIframe').mockReturnValue(true)
      const client = createMockClient({ banner: validConfig })
      render(
        <AppView client={client} appOrMenuElemId="app" />
      )
      expect(screen.queryByTestId('mock-banner')).not.toBeInTheDocument()
    })

    it('does not render banner when outside date range', () => {
      jest.spyOn(bannerUtils, 'isWithinDateRange').mockReturnValue(false)
      const config = { ...validConfig, startDate: Date.now() + 999999 }
      const client = createMockClient({ banner: config })
      render(
        <AppView client={client} appOrMenuElemId="app" />
      )
      expect(screen.queryByTestId('mock-banner')).not.toBeInTheDocument()
    })
  })

  describe('banner with URL string', () => {
    it('fetches and renders banner when given a URL string', async () => {
      jest.spyOn(bannerUtils, 'fetchBannerConfig').mockResolvedValue(validConfig)
      const client = createMockClient({ banner: 'https://example.com/banner.json' })
      render(
        <AppView client={client} appOrMenuElemId="app" />
      )

      await waitFor(() => {
        expect(screen.getByTestId('mock-banner')).toBeInTheDocument()
      })
      expect(bannerUtils.fetchBannerConfig).toHaveBeenCalledWith('https://example.com/banner.json')
    })

    it('does not render banner when fetch returns null', async () => {
      jest.spyOn(bannerUtils, 'fetchBannerConfig').mockResolvedValue(null)
      const client = createMockClient({ banner: 'https://example.com/banner.json' })
      render(
        <AppView client={client} appOrMenuElemId="app" />
      )

      // Give the promise time to resolve
      await act(async () => {
        await Promise.resolve()
      })
      expect(screen.queryByTestId('mock-banner')).not.toBeInTheDocument()
    })
  })

  describe('no banner option', () => {
    it('does not render banner when banner option is not provided', () => {
      const client = createMockClient({})
      render(
        <AppView client={client} appOrMenuElemId="app" />
      )
      expect(screen.queryByTestId('mock-banner')).not.toBeInTheDocument()
    })
  })

  describe('onHeightChange callback', () => {
    it('calls onHeightChange when banner is rendered with non-zero height', () => {
      const onHeightChange = jest.fn()
      const client = createMockClient({ banner: validConfig, onHeightChange })

      // Mock offsetHeight on banner wrapper div
      jest.spyOn(HTMLDivElement.prototype, 'offsetHeight', 'get').mockReturnValue(40)

      render(
        <AppView client={client} appOrMenuElemId="app" onHeightChange={onHeightChange} />
      )

      // kMenuBarHeight (30) + banner height (40) = 70
      expect(onHeightChange).toHaveBeenCalledWith(70)
    })

    it('calls onHeightChange with menu bar height when banner is dismissed', () => {
      const onHeightChange = jest.fn()
      const client = createMockClient({ banner: validConfig, onHeightChange })

      jest.spyOn(HTMLDivElement.prototype, 'offsetHeight', 'get').mockReturnValue(40)

      render(
        <AppView client={client} appOrMenuElemId="app" onHeightChange={onHeightChange} />
      )

      onHeightChange.mockClear()

      // Dismiss the banner
      act(() => {
        screen.getByTestId('mock-banner-dismiss').click()
      })

      // After dismiss, height should be just menu bar (30)
      expect(onHeightChange).toHaveBeenCalledWith(30)
    })

    it('does not call onHeightChange when banner height is zero', () => {
      const onHeightChange = jest.fn()
      const client = createMockClient({ banner: validConfig, onHeightChange })

      // offsetHeight returns 0 by default in jsdom, so no mock needed
      render(
        <AppView client={client} appOrMenuElemId="app" onHeightChange={onHeightChange} />
      )

      // Height 0 matches initial state (0), so no change, no callback
      expect(onHeightChange).not.toHaveBeenCalled()
    })
  })

  describe('RAF cleanup in bannerRef', () => {
    it('cancels pending RAF on unmount', () => {
      const rafCallbacks = new Map<number, FrameRequestCallback>()
      let nextId = 1
      window.requestAnimationFrame = (cb: FrameRequestCallback) => {
        const id = nextId++
        rafCallbacks.set(id, cb)
        return id
      }
      window.cancelAnimationFrame = (id: number) => {
        rafCallbacks.delete(id)
      }

      jest.spyOn(HTMLDivElement.prototype, 'offsetHeight', 'get').mockReturnValue(40)

      const client = createMockClient({ banner: validConfig })
      const { unmount } = render(
        <AppView client={client} appOrMenuElemId="app" />
      )

      // There should be a pending RAF from the banner ref
      expect(rafCallbacks.size).toBe(1)

      // Unmount cancels the pending RAF
      unmount()
      expect(rafCallbacks.size).toBe(0)
    })

    it('does not call setState if RAF fires after unmount', () => {
      const rafCallbacks: FrameRequestCallback[] = []
      window.requestAnimationFrame = (cb: FrameRequestCallback) => {
        rafCallbacks.push(cb)
        return rafCallbacks.length
      }
      // cancelAnimationFrame is a no-op so the callbacks survive for manual firing
      window.cancelAnimationFrame = () => {}

      jest.spyOn(HTMLDivElement.prototype, 'offsetHeight', 'get').mockReturnValue(40)

      const client = createMockClient({ banner: validConfig })
      const { unmount } = render(
        <AppView client={client} appOrMenuElemId="app" />
      )

      unmount()

      // Manually fire pending RAF callbacks - should not throw or call setState
      const setStateSpy = jest.spyOn(React.Component.prototype, 'setState')
      rafCallbacks.forEach(cb => cb(0))
      expect(setStateSpy).not.toHaveBeenCalled()
    })
  })
})
