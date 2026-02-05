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
  buttonBackgroundColor?: string
  buttonTextColor?: string
  closeButtonColor?: string
  paddingX?: number
  paddingY?: number
  buttonPaddingX?: number
  buttonPaddingY?: number
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
