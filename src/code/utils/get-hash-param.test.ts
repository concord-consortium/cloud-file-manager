import getHashParam from "./get-hash-param"

describe('getHashParam', () => {
  const originalLocation = window.location

  const mockWindowLocation = (newLocation: Location | URL) => {
    delete (window as any).location
    window.location = newLocation as Location
  }

  const setHash = (hash: string) => {
    const url = new URL("https://concord.org")
    url.hash = hash
    mockWindowLocation(url)
  }

  afterEach(() => {
    mockWindowLocation(originalLocation)
  })

  it('should return null for empty hash', () => {
    setHash("")
    expect(getHashParam("foo")).toBeNull()
  })

  it('should return null for non-existent param', () => {
    setHash("#bar=baz")
    expect(getHashParam("foo")).toBeNull()
  })

  it('should parse single param', () => {
    setHash("#foo=bar")
    expect(getHashParam("foo")).toBe("bar")
  })

  it('should parse param from multiple params', () => {
    setHash("#foo=bar&baz=qux")
    expect(getHashParam("foo")).toBe("bar")
    expect(getHashParam("baz")).toBe("qux")
  })

  it('should handle URL-encoded values', () => {
    setHash("#foo=hello%20world")
    expect(getHashParam("foo")).toBe("hello world")
  })

  it('should handle multiply-encoded values', () => {
    // Double-encoded space: %2520 -> %20 -> space
    setHash("#foo=hello%2520world")
    expect(getHashParam("foo")).toBe("hello world")
  })

  it('should handle triple-encoded values', () => {
    // Triple-encoded space: %252520 -> %2520 -> %20 -> space
    setHash("#foo=hello%252520world")
    expect(getHashParam("foo")).toBe("hello world")
  })

  it('should handle special characters in values', () => {
    setHash("#url=" + encodeURIComponent("https://example.com?a=1&b=2"))
    expect(getHashParam("url")).toBe("https://example.com?a=1&b=2")
  })

  it('should handle empty value', () => {
    setHash("#foo=")
    expect(getHashParam("foo")).toBe("")
  })

  it('should handle param without equals sign', () => {
    setHash("#foo")
    // The function splits on "=", so foo without = gives undefined for value
    // which gets decoded to the string "undefined"
    expect(getHashParam("foo")).toBe("undefined")
  })
})
