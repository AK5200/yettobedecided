/**
 * SSO redirect identity detection for public hub and widget pages.
 *
 * Supports two mechanisms:
 *
 * 1. URL params (after redirect from client login page):
 *    Trust mode:  ?kelo_user_id=X&kelo_user_email=Y&kelo_user_name=Z
 *    JWT mode:    ?kelo_token=SIGNED_JWT
 *
 * 2. Flat localStorage keys (set by client's JS after login):
 *    kelo_user_id, kelo_user_email, kelo_user_name
 *
 * Both paths store the result into kelo_identified_user_${orgSlug}
 * which is what the widget/public hub components read.
 */

interface SSOIdentity {
  id?: string
  email: string
  name?: string
  token?: string
}

/**
 * Check URL params for SSO identity, then fall back to flat localStorage keys.
 * Stores into kelo_identified_user_${orgSlug} and cleans up.
 */
export function detectSSORedirectIdentity(orgSlug: string): SSOIdentity | null {
  if (typeof window === 'undefined') return null

  // --- Path 1: URL params ---
  const params = new URLSearchParams(window.location.search)

  // Trust mode params
  const urlEmail = params.get('kelo_user_email')?.trim()
  if (urlEmail) {
    const identity: SSOIdentity = {
      id: params.get('kelo_user_id')?.trim() || undefined,
      email: urlEmail,
      name: params.get('kelo_user_name')?.trim() || urlEmail.split('@')[0],
    }
    persist(orgSlug, identity)
    cleanUrlParams(['kelo_user_id', 'kelo_user_email', 'kelo_user_name', 'kelo'])
    return identity
  }

  // JWT mode param
  const token = params.get('kelo_token')?.trim()
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.email) {
        const identity: SSOIdentity = {
          id: payload.id || payload.sub,
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          token,
        }
        persist(orgSlug, identity)
        cleanUrlParams(['kelo_token', 'kelo'])
        return identity
      }
    } catch {}
  }

  // --- Path 2: Flat localStorage keys (set by client's JS) ---
  try {
    const lsEmail = localStorage.getItem('kelo_user_email')?.trim()
    if (lsEmail) {
      const identity: SSOIdentity = {
        id: localStorage.getItem('kelo_user_id')?.trim() || undefined,
        email: lsEmail,
        name: localStorage.getItem('kelo_user_name')?.trim() || lsEmail.split('@')[0],
      }
      persist(orgSlug, identity)
      return identity
    }
  } catch {}

  return null
}

function persist(orgSlug: string, identity: SSOIdentity) {
  try {
    localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(identity))
  } catch {}
}

function cleanUrlParams(keys: string[]) {
  const params = new URLSearchParams(window.location.search)
  let changed = false
  for (const key of keys) {
    if (params.has(key)) {
      params.delete(key)
      changed = true
    }
  }
  if (changed) {
    const cleanSearch = params.toString()
    const cleanUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '') + window.location.hash
    window.history.replaceState({}, '', cleanUrl)
  }
}
