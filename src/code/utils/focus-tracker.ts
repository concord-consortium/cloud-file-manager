// Tracks recently focused interactive elements (not <body> or <html>).
// Used by ModalView to restore focus after a dialog closes, since the
// triggering menu may have already closed and moved focus to <body>
// before the dialog mounts.

const recentlyFocused: HTMLElement[] = []
const MAX_HISTORY = 10
let isListening = false

function handleFocusIn(e: FocusEvent) {
  const target = e.target as HTMLElement
  if (target && target !== document.body && target !== document.documentElement) {
    recentlyFocused.push(target)
    if (recentlyFocused.length > MAX_HISTORY) {
      recentlyFocused.shift()
    }
  }
}

export function startFocusTracker() {
  if (!isListening) {
    document.addEventListener('focusin', handleFocusIn, true)
    isListening = true
  }
}

// Returns the most recently focused element that is still in the DOM.
export function getLastFocusedElement(): HTMLElement | null {
  for (let i = recentlyFocused.length - 1; i >= 0; i--) {
    if (document.contains(recentlyFocused[i])) {
      return recentlyFocused[i]
    }
  }
  return null
}
