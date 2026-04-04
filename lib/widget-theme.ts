/**
 * Reads theme and accent color from URL params (set by widget.js)
 * and applies them to the iframe document.
 * Also listens for live theme changes via postMessage.
 */
export function applyWidgetTheme() {
  if (typeof window === 'undefined') return { theme: 'light', accent: null }

  const params = new URLSearchParams(window.location.search)
  const theme = params.get('theme')
  const accent = params.get('accent')

  // Apply theme
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark')
  }

  // Apply accent color as CSS custom property
  if (accent) {
    document.documentElement.style.setProperty('--kelo-accent', accent)
  }

  // Listen for live theme changes from parent widget.js
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'kelo:theme') {
      if (e.data.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  })

  return { theme: theme || 'light', accent }
}

/**
 * Hook-friendly version: call in useEffect
 * Returns detected accent color (or null)
 */
export function getWidgetAccent(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('accent')
}

/**
 * Read widget data embedded in URL hash by widget.js
 * Returns the full widget data object or null
 */
export function getEmbeddedWidgetData(): any | null {
  if (typeof window === 'undefined') return null
  try {
    const hash = window.location.hash
    if (!hash || !hash.includes('kelo=')) return null
    const encoded = hash.split('kelo=')[1]
    if (!encoded) return null
    const json = decodeURIComponent(escape(atob(decodeURIComponent(encoded))))
    return JSON.parse(json)
  } catch {
    return null
  }
}
