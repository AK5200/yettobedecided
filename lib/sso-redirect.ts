/**
 * SSO redirect identity detection for public hub pages.
 *
 * After a "Your Website" login redirect, the client should redirect back
 * with identity info appended to the URL:
 *
 * Trust mode:  ?kelo_user_id=X&kelo_user_email=Y&kelo_user_name=Z
 * JWT mode:    ?kelo_token=SIGNED_JWT
 *
 * This module detects those params, stores the identity in localStorage,
 * and cleans the URL.
 */

interface SSOIdentity {
  id?: string
  email: string
  name?: string
}

/**
 * Check URL for SSO redirect identity params.
 * Returns the identity if found, null otherwise.
 * Automatically cleans the URL params after extraction.
 */
export function detectSSORedirectIdentity(orgSlug: string): SSOIdentity | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)

  // Check for trust mode params
  const email = params.get('kelo_user_email')
  if (email) {
    const identity: SSOIdentity = {
      id: params.get('kelo_user_id') || undefined,
      email,
      name: params.get('kelo_user_name') || email.split('@')[0],
    }

    // Store in localStorage
    try {
      localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(identity))
    } catch {}

    // Clean URL — remove kelo_ params
    params.delete('kelo_user_id')
    params.delete('kelo_user_email')
    params.delete('kelo_user_name')
    params.delete('kelo')
    const cleanSearch = params.toString()
    const cleanUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '') + window.location.hash
    window.history.replaceState({}, '', cleanUrl)

    return identity
  }

  // Check for JWT mode param
  const token = params.get('kelo_token')
  if (token) {
    // Decode JWT payload (client-side, no verification — server verifies when used)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.email) {
        const identity: SSOIdentity = {
          id: payload.id || payload.sub,
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
        }

        // Store identity AND token for server-side verification
        localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify({
          ...identity,
          token,
        }))

        // Clean URL
        params.delete('kelo_token')
        params.delete('kelo')
        const cleanSearch = params.toString()
        const cleanUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '') + window.location.hash
        window.history.replaceState({}, '', cleanUrl)

        return identity
      }
    } catch {
      // Invalid JWT, ignore
    }
  }

  return null
}
