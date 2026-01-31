import getQueryParam from "./get-query-param"

describe('getQueryParam', () => {
  const originalLocation = window.location

  const mockWindowLocation = (newLocation: Location | URL) => {
    delete (window as any).location
    window.location = newLocation as Location
  }

  const setLocation = (url: string) => {
    mockWindowLocation(new URL(url))
  }

  const setQueryParams = (params: string) => {
    setLocation(`https://concord.org${params ? '?' : ''}${params || ""}`)
  }

  afterEach(() => {
    mockWindowLocation(originalLocation)
  })

  it('should parse empty params', () => {
    setQueryParams("")
    expect(getQueryParam("foo")).toBeNull()
  })

  it('should parse params without values', () => {
    setQueryParams("foo")
    expect(getQueryParam("foo")).toBeNull()
  })

  it('should parse params with values', () => {
    setQueryParams("foo=bar")
    expect(getQueryParam("foo")).toBe('bar')
  })
})
