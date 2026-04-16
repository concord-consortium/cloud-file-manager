export const withTestId = <T extends Record<string, any>>(props: T, testId: string): T => ({
  ...props,
  'data-testid': testId
})

export const sanitizeMenuItemKey = (key: string): string => {
  if (typeof key !== 'string') {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`sanitizeMenuItemKey expected a string, got ${typeof key}`)
    }
    return ''
  }
  const normalized = key.trim().toLowerCase()
  const replaced = normalized.replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-')
  return replaced.replace(/^-+|-+$/g, '')
}

export const providerTestIdName = (name: string): string => {
  if (typeof name !== 'string') {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`providerTestIdName expected a string, got ${typeof name}`)
    }
    return ''
  }
  const raw = name.replace(/-provider$/i, '')
  const withDashes = raw.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  return sanitizeMenuItemKey(withDashes)
}
