import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { upsertWidgetUser } from '@/lib/widget-users'
import { handleOptions, withCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')

  try {
    const body = await request.json()
    const { token, code } = body

    if (!token || !code) {
      return withCors(
        NextResponse.json({ error: 'token and code are required' }, { status: 400 }),
        origin
      )
    }

    const jwtSecret = process.env.WIDGET_JWT_SECRET || process.env.JWT_SECRET
    if (!jwtSecret) {
      return withCors(
        NextResponse.json({ error: 'Server configuration error' }, { status: 500 }),
        origin
      )
    }

    let payload: any
    try {
      payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] })
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return withCors(
          NextResponse.json({ error: 'Verification code expired. Please request a new one.' }, { status: 410 }),
          origin
        )
      }
      return withCors(
        NextResponse.json({ error: 'Invalid verification token' }, { status: 400 }),
        origin
      )
    }

    if (payload.type !== 'magic_link_verify') {
      return withCors(
        NextResponse.json({ error: 'Invalid token type' }, { status: 400 }),
        origin
      )
    }

    if (payload.attempts >= payload.maxAttempts) {
      return withCors(
        NextResponse.json({
          error: 'Too many attempts. Please request a new code.',
          exhausted: true,
        }, { status: 429 }),
        origin
      )
    }

    const submittedHash = crypto
      .createHash('sha256')
      .update(code.toString().trim() + payload.salt)
      .digest('hex')

    if (!crypto.timingSafeEqual(
      Buffer.from(submittedHash, 'hex'),
      Buffer.from(payload.codeHash, 'hex')
    )) {
      const attemptsUsed = payload.attempts + 1
      const remaining = payload.maxAttempts - attemptsUsed

      const newToken = jwt.sign(
        { ...payload, attempts: attemptsUsed, iat: undefined },
        jwtSecret,
        { expiresIn: '15m' }
      )

      return withCors(
        NextResponse.json({
          error: 'Invalid code',
          attemptsRemaining: remaining,
          verificationToken: newToken,
        }, { status: 401 }),
        origin
      )
    }

    const { user, error: userError } = await upsertWidgetUser(payload.orgId, {
      email: payload.email,
      user_source: 'magic_link',
    })

    if (userError || !user) {
      return withCors(
        NextResponse.json({ error: userError || 'Failed to create user' }, { status: 500 }),
        origin
      )
    }

    return withCors(
      NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        },
      }),
      origin
    )
  } catch (error) {
    console.error('Magic link verify failed:', error)
    return withCors(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
      origin
    )
  }
}
