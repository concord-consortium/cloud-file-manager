/**
 * Utilities for detecting iOS Safari and handling iOS-specific file download issues.
 *
 * iOS Safari 18.2+ has a bug where blob URLs created with URL.createObjectURL()
 * don't properly save to the Files app - they get stuck in Safari's temporary
 * download cache. This module provides detection and a data URL workaround.
 */

/**
 * Detects if the current browser is Safari on iOS.
 * This includes iPad in desktop mode (which reports as "Macintosh" but has touch).
 */
export function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent

  // Check for iOS devices (iPhone, iPad, iPod)
  // Also check for iPad in desktop mode (reports as Macintosh but has touch capability)
  // Regular Macs report maxTouchPoints = 0, iPads report 5
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0)

  // Check for Safari (not Chrome, Firefox, Edge, etc. on iOS)
  // All iOS browsers use WebKit, but we specifically want Safari's behavior
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)

  return isIOS && isSafari
}

/**
 * Converts a Blob to a data URL using FileReader.
 * This is a workaround for iOS Safari's blob URL issues.
 *
 * @param blob - The blob to convert
 * @returns Promise<string> - The data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('FileReader did not return a string'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Downloads a file using a data URL approach.
 * Creates a temporary anchor element with the data URL and triggers a click.
 *
 * Note: The `download` attribute behavior varies by browser for data URLs.
 * Testing on iOS Safari 18.7 showed the filename is honored, though older
 * versions may use a generic name. Desktop browsers generally respect the
 * filename value.
 *
 * @param blob - The file content as a Blob
 * @param filename - The filename for the download
 */
export async function downloadViaDataUrl(blob: Blob, filename: string): Promise<void> {
  const dataUrl = await blobToDataUrl(blob)

  // Create a temporary link and click it
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Handles file download on iOS Safari, working around the blob URL bug.
 * Uses data URL approach which triggers Safari's standard download dialog.
 *
 * @param blob - The file content as a Blob
 * @param filename - The filename to use
 * @returns Promise<boolean> - true if handled, false if should use default behavior
 */
export async function handleIOSDownload(blob: Blob, filename: string): Promise<boolean> {
  if (!isIOSSafari()) return false

  try {
    await downloadViaDataUrl(blob, filename)
    return true
  } catch (err) {
    // If data URL approach fails, let the caller use default behavior
    return false
  }
}
