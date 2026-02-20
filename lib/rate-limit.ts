// Simple in-memory sliding window rate limiter.
// Works within a single Lambda instance (good enough for MVP burst protection).
// For distributed rate limiting across all instances, replace with Upstash Ratelimit.

interface WindowEntry {
  count: number
  resetAt: number
}

const windows = new Map<string, WindowEntry>()
let callCount = 0

export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { allowed: boolean } {
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  // Periodic cleanup to prevent memory leak on long-lived instances
  if (++callCount % 500 === 0) {
    for (const [k, v] of windows) {
      if (v.resetAt < now) windows.delete(k)
    }
  }

  const entry = windows.get(key)

  if (!entry || entry.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= limit) {
    return { allowed: false }
  }

  entry.count++
  return { allowed: true }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}
