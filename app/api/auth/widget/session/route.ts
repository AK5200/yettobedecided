import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Returns the current widget session user from the widget_session cookie
// Used by public hub pages to check if user is already authenticated via widget
export async function GET(request: NextRequest) {
  const token = request.cookies.get('widget_session')?.value

  if (!token) {
    return NextResponse.json({ user: null })
  }

  const jwtSecret = process.env.WIDGET_JWT_SECRET || process.env.JWT_SECRET
  if (!jwtSecret) {
    return NextResponse.json({ user: null })
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as {
      id: string
      email: string
      name: string
      avatar?: string
    }

    return NextResponse.json({
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        avatar_url: decoded.avatar || null,
      },
    })
  } catch {
    // Token expired or invalid — clear it
    const response = NextResponse.json({ user: null })
    response.cookies.set('widget_session', '', { path: '/', maxAge: 0 })
    return response
  }
}
