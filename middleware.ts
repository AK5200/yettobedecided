import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { handleOptions, isOriginAllowed, corsHeaders } from '@/lib/cors'

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const pathname = request.nextUrl.pathname

  // Gate /login, /signup, /pricing — only accessible via /homeanu (sets kelo_home cookie)
  if (pathname === '/login' || pathname === '/signup' || pathname === '/pricing') {
    const hasHomeCookie = request.cookies.get('kelo_home')?.value
    if (!hasHomeCookie) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Handle CORS preflight requests for widget API routes and health check
  if (request.method === 'OPTIONS' && 
      (pathname.startsWith('/api/widget') || 
       pathname.startsWith('/widget') || 
       pathname === '/api/health')) {
    return handleOptions(request)
  }

  // Process Supabase session update
  const response = await updateSession(request)

  // Add CORS headers for widget API routes and health check
  if (pathname.startsWith('/api/widget') || 
      pathname.startsWith('/widget') || 
      pathname === '/api/health') {
    const headers = corsHeaders(origin)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
