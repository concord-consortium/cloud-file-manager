import { isIOSSafari, blobToDataUrl, downloadViaDataUrl, handleIOSDownload } from './ios-file-saver'

describe('ios-file-saver', () => {

  describe('isIOSSafari', () => {
    const originalNavigator = global.navigator

    const mockNavigator = (userAgent: string, platform = '', maxTouchPoints = 0) => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent, platform, maxTouchPoints },
        writable: true,
        configurable: true
      })
    }

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true
      })
    })

    it('returns true for iPhone Safari', () => {
      mockNavigator(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        'iPhone'
      )
      expect(isIOSSafari()).toBe(true)
    })

    it('returns true for iPad Safari', () => {
      mockNavigator(
        'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        'iPad'
      )
      expect(isIOSSafari()).toBe(true)
    })

    it('returns true for iPad in desktop mode (MacIntel with touch)', () => {
      mockNavigator(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
        'MacIntel',
        5
      )
      expect(isIOSSafari()).toBe(true)
    })

    it('returns false for actual Mac Safari (no touch points)', () => {
      mockNavigator(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
        'MacIntel',
        0
      )
      expect(isIOSSafari()).toBe(false)
    })

    it('returns false for Chrome on iOS', () => {
      mockNavigator(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
        'iPhone'
      )
      expect(isIOSSafari()).toBe(false)
    })

    it('returns false for Firefox on iOS', () => {
      mockNavigator(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.0 Mobile/15E148 Safari/605.1.15',
        'iPhone'
      )
      expect(isIOSSafari()).toBe(false)
    })

    it('returns false for Edge on iOS', () => {
      mockNavigator(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1',
        'iPhone'
      )
      expect(isIOSSafari()).toBe(false)
    })

    it('returns false for Chrome on desktop', () => {
      mockNavigator(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Win32',
        0
      )
      expect(isIOSSafari()).toBe(false)
    })

    it('returns false for Firefox on desktop', () => {
      mockNavigator(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Win32',
        0
      )
      expect(isIOSSafari()).toBe(false)
    })
  })

  describe('blobToDataUrl', () => {
    it('converts a text blob to a data URL', async () => {
      const blob = new Blob(['hello world'], { type: 'text/plain' })
      const dataUrl = await blobToDataUrl(blob)
      expect(dataUrl).toMatch(/^data:text\/plain;base64,/)
      // 'hello world' in base64 is 'aGVsbG8gd29ybGQ='
      expect(dataUrl).toBe('data:text/plain;base64,aGVsbG8gd29ybGQ=')
    })

    it('converts a JSON blob to a data URL', async () => {
      const content = JSON.stringify({ test: 'value' })
      const blob = new Blob([content], { type: 'application/json' })
      const dataUrl = await blobToDataUrl(blob)
      expect(dataUrl).toMatch(/^data:application\/json;base64,/)
    })

    it('handles empty blobs', async () => {
      const blob = new Blob([], { type: 'text/plain' })
      const dataUrl = await blobToDataUrl(blob)
      expect(dataUrl).toBe('data:text/plain;base64,')
    })
  })

  describe('downloadViaDataUrl', () => {
    let mockLink: { href: string; download: string; style: { display: string }; click: jest.Mock }
    let appendChildSpy: jest.SpyInstance
    let removeChildSpy: jest.SpyInstance
    let createElementSpy: jest.SpyInstance

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: jest.fn()
      }
      createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement)
      appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLElement)
      removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLElement)
    })

    afterEach(() => {
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    it('creates an anchor element with data URL and clicks it', async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' })
      await downloadViaDataUrl(blob, 'test-file.txt')

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(mockLink.href).toMatch(/^data:text\/plain;base64,/)
      expect(mockLink.download).toBe('test-file.txt')
      expect(mockLink.style.display).toBe('none')
      expect(appendChildSpy).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
    })
  })

  describe('handleIOSDownload', () => {
    const originalNavigator = global.navigator

    const mockNavigator = (userAgent: string, platform = '', maxTouchPoints = 0) => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent, platform, maxTouchPoints },
        writable: true,
        configurable: true
      })
    }

    let mockLink: { href: string; download: string; style: { display: string }; click: jest.Mock }
    let createElementSpy: jest.SpyInstance
    let appendChildSpy: jest.SpyInstance
    let removeChildSpy: jest.SpyInstance

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: jest.fn()
      }
      createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement)
      appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLElement)
      removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLElement)
    })

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true
      })
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    it('returns false for non-iOS browsers', async () => {
      mockNavigator(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Win32',
        0
      )
      const blob = new Blob(['test'], { type: 'text/plain' })
      const result = await handleIOSDownload(blob, 'test.txt')
      expect(result).toBe(false)
      expect(mockLink.click).not.toHaveBeenCalled()
    })

    it('returns true and triggers download for iOS Safari', async () => {
      mockNavigator(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        'iPhone'
      )
      const blob = new Blob(['test content'], { type: 'application/json' })
      const result = await handleIOSDownload(blob, 'document.json')

      expect(result).toBe(true)
      expect(mockLink.download).toBe('document.json')
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('returns true for iPad in desktop mode', async () => {
      mockNavigator(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
        'MacIntel',
        5
      )
      const blob = new Blob(['test'], { type: 'text/plain' })
      const result = await handleIOSDownload(blob, 'test.txt')

      expect(result).toBe(true)
      expect(mockLink.click).toHaveBeenCalled()
    })
  })
})
