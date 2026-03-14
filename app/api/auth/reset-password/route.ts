import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/email/triggers'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')

    // Generate password reset link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${baseUrl}/api/auth/callback?next=/auth/reset-password`,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Send password reset email via Resend
    if (data?.properties?.action_link) {
      try {
        await sendPasswordResetEmail(email, data.properties.action_link)
        return NextResponse.json({ 
          message: 'Password reset email sent! Please check your inbox.' 
        })
      } catch (emailError) {
        console.error('Failed to send password reset email via Resend:', emailError)
        return NextResponse.json({ 
          error: 'Failed to send password reset email. Please try again later.' 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Failed to generate reset link' }, { status: 500 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
