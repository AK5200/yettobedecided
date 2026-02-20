import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { magicLinkCodeEmail } from '@/lib/email/templates'
import { handleOptions, withCors } from '@/lib/cors'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')

  try {
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(`magic-link:${ip}`, 5, 60)
    if (!allowed) {
      return withCors(
        NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 }),
        origin
      )
    }

    const body = await request.json()
    const { email, org_slug } = body

    if (!email || !org_slug) {
      return withCors(
        NextResponse.json({ error: 'email and org_slug are required' }, { status: 400 }),
        origin
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return withCors(
        NextResponse.json({ error: 'Invalid email format' }, { status: 400 }),
        origin
      )
    }

    const client = createAdminClient()
    const { data: org } = await client
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', org_slug)
      .single()

    if (!org) {
      return withCors(
        NextResponse.json({ error: 'Organization not found' }, { status: 404 }),
        origin
      )
    }

    const code = crypto.randomInt(100000, 999999).toString()
    const salt = crypto.randomBytes(16).toString('hex')
    const codeHash = crypto
      .createHash('sha256')
      .update(code + salt)
      .digest('hex')

    const jwtSecret = process.env.WIDGET_JWT_SECRET || process.env.JWT_SECRET
    if (!jwtSecret) {
      return withCors(
        NextResponse.json({ error: 'Server configuration error' }, { status: 500 }),
        origin
      )
    }

    const verificationToken = jwt.sign(
      {
        type: 'magic_link_verify',
        email: email.toLowerCase(),
        codeHash,
        salt,
        orgSlug: org_slug,
        orgId: org.id,
        attempts: 0,
        maxAttempts: 5,
      },
      jwtSecret,
      { expiresIn: '15m' }
    )

    const { success, error: emailError } = await sendEmail({
      to: email,
      subject: `Your ${org.name} verification code`,
      html: magicLinkCodeEmail({ code, orgName: org.name }),
    })

    if (!success) {
      console.error('Magic link email failed:', emailError)
      return withCors(
        NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 }),
        origin
      )
    }

    return withCors(
      NextResponse.json({ verificationToken, message: 'Verification code sent' }),
      origin
    )
  } catch (error) {
    console.error('Magic link send failed:', error)
    return withCors(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
      origin
    )
  }
}
