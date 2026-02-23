import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendSignupConfirmationEmail } from '@/lib/email/triggers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(`signup:${ip}`, 5, 60)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const baseUrl = (() => {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      return host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    })()

    // Use admin.generateLink to create user + get confirmation link
    // This does NOT send Supabase's default email — we send via Resend instead
    const { data: linkData, error } = await adminClient.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: `${baseUrl}/api/auth/callback`,
      },
    })

    if (error) {
      if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Send confirmation email via Resend
    if (linkData?.properties?.action_link && linkData.user?.email) {
      try {
        await sendSignupConfirmationEmail(
          linkData.user.email,
          linkData.properties.action_link
        )
      } catch (emailError) {
        console.error('Failed to send confirmation email via Resend:', emailError)
        // Don't fail the signup if email fails — user can request resend
      }
    }

    return NextResponse.json({
      message: 'Account created! Please check your email to confirm your account.',
      user: linkData?.user ?? null
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
