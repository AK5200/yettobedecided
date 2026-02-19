import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Get allowed origins based on environment
 */
export function getAllowedOrigins(): string[] {
  const origins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:64807',
    // Add production domains from env
    ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
  ]
  return origins
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  
  // In development, allow all localhost origins
  if (process.env.NODE_ENV === 'development') {
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return true
    }
  }
  
  const allowedOrigins = getAllowedOrigins()
  return allowedOrigins.includes(origin)
}

/**
 * Get CORS headers for a response
 */
export function corsHeaders(origin?: string | null): Record<string, string> {
  const isAllowed = origin && isOriginAllowed(origin)
  const allowedOrigin = isAllowed ? origin : '*'

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  }

  // Only set credentials when origin is specific (browsers reject credentials + wildcard)
  if (isAllowed) {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return headers
}

/**
 * Add CORS headers to a response
 */
export function withCors(response: NextResponse, origin?: string | null): NextResponse {
  const headers = corsHeaders(origin)
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * Handle OPTIONS preflight request
 */
export function handleOptions(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders(origin),
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  })
}
