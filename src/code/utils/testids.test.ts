import { providerTestIdName, sanitizeMenuItemKey, withTestId } from './testids'

describe('sanitizeMenuItemKey', () => {
  it('lowercases and kebabs alphanumeric runs', () => {
    expect(sanitizeMenuItemKey('OpenFile')).toBe('openfile')
    expect(sanitizeMenuItemKey('Open File')).toBe('open-file')
    expect(sanitizeMenuItemKey('open_file')).toBe('open-file')
    expect(sanitizeMenuItemKey('open   file')).toBe('open-file')
  })

  it('collapses runs of non-alphanumerics to a single dash', () => {
    expect(sanitizeMenuItemKey('open__file__now!')).toBe('open-file-now')
    expect(sanitizeMenuItemKey('foo---bar')).toBe('foo-bar')
  })

  it('trims leading and trailing dashes', () => {
    expect(sanitizeMenuItemKey('--foo--')).toBe('foo')
    expect(sanitizeMenuItemKey('!foo!')).toBe('foo')
  })

  it('handles empty and all-special-char inputs', () => {
    expect(sanitizeMenuItemKey('')).toBe('')
    expect(sanitizeMenuItemKey('   ')).toBe('')
    expect(sanitizeMenuItemKey('!!!')).toBe('')
  })

  it('returns empty string and warns when given a non-string', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      expect(sanitizeMenuItemKey(undefined as any)).toBe('')
      expect(sanitizeMenuItemKey(null as any)).toBe('')
      expect(sanitizeMenuItemKey({ foo: 1 } as any)).toBe('')
      expect(spy).toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })
})

describe('providerTestIdName', () => {
  it('strips trailing "-provider" suffix', () => {
    expect(providerTestIdName('url-provider')).toBe('url')
    expect(providerTestIdName('s3-provider')).toBe('s3')
    expect(providerTestIdName('s3-share-provider')).toBe('s3-share')
  })

  it('converts camelCase to kebab-case', () => {
    expect(providerTestIdName('googleDrive')).toBe('google-drive')
    expect(providerTestIdName('documentStore')).toBe('document-store')
    expect(providerTestIdName('localFile')).toBe('local-file')
    expect(providerTestIdName('localStorage')).toBe('local-storage')
    expect(providerTestIdName('readOnly')).toBe('read-only')
    expect(providerTestIdName('postMessage')).toBe('post-message')
    expect(providerTestIdName('interactiveApi')).toBe('interactive-api')
  })

  it('handles lowercase names unchanged', () => {
    expect(providerTestIdName('lara')).toBe('lara')
  })

  it('returns empty string and warns when given a non-string', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      expect(providerTestIdName(undefined as any)).toBe('')
      expect(spy).toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })
})

describe('withTestId', () => {
  it('adds data-testid to an existing props object without mutating it', () => {
    const original = { className: 'foo', onClick: jest.fn() }
    const result = withTestId(original, 'cfm-example')
    expect(result).toEqual({
      className: 'foo',
      onClick: original.onClick,
      'data-testid': 'cfm-example'
    })
    expect(original).not.toHaveProperty('data-testid')
  })

  it('adds data-testid to an empty props object', () => {
    expect(withTestId({}, 'cfm-bare')).toEqual({ 'data-testid': 'cfm-bare' })
  })

  it('overrides an existing data-testid in the input props', () => {
    const result = withTestId({ 'data-testid': 'old' }, 'cfm-new')
    expect(result['data-testid']).toBe('cfm-new')
  })
})
