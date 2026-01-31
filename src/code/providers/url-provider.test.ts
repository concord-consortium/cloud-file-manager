import $ from 'jquery'
import { createCFMTestClient } from '../../test/test-utils'
import { CloudContent, CloudMetadata } from './provider-interface'
import URLProvider from './url-provider'

describe('URLProvider', () => {
  interface IAjaxOptions {
    url: string
    success: (data: any) => void
    error: () => void
  }
  const successUrl = 'https://concord.org/successUrl'
  const successResponse = 'Success!'
  const errorUrl = 'https://concord.org/errorUrl'

  it('should accept urlDisplayName option', () => {
    const client = createCFMTestClient()
    const provider = new URLProvider({ urlDisplayName: 'foo' }, client)
    expect(provider.urlDisplayName).toBe('foo')
  })

  it('should call callback with data when ajax call succeeds', () => {
    $.ajax = jest.fn((options: IAjaxOptions) => {
      options.success(successResponse)
    }) as any
    const callback = jest.fn()
    // multiple tests with console spies conflict with each other leading to failures
    const client = createCFMTestClient({ skipCallTest: true })
    const provider = new URLProvider(undefined, client)
    expect(provider.canOpenSaved()).toBe(false)
    provider.openFileFromUrl(successUrl, callback)
    expect(callback).toHaveBeenCalled()
    const [err, content, metadata]: [string | null, CloudContent, CloudMetadata] = callback.mock.calls[0]
    expect(err).toBeNull()
    expect(content.getClientContent()).toBe(successResponse)
    expect(metadata.url).toBe(successUrl)
  })

  it('should call callback with error when ajax call fails', () => {
    $.ajax = jest.fn((options: IAjaxOptions) => {
      options.error()
    }) as any
    const callback = jest.fn()
    // multiple tests with console spies conflict with each other leading to failures
    const client = createCFMTestClient({ skipCallTest: true })
    const provider = new URLProvider(undefined, client)
    expect(provider.canOpenSaved()).toBe(false)
    provider.openFileFromUrl(errorUrl, callback)
    expect(callback).toHaveBeenCalled()
    const [err, content, metadata]: [string | null, CloudContent, CloudMetadata] = callback.mock.calls[0]
    expect(typeof err).toBe('string')
    expect(err?.includes(errorUrl)).toBe(true)
    expect(content).toBeUndefined()
    expect(metadata).toBeUndefined()
  })
})
