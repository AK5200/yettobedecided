import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendSignupConfirmationEmail } from '@/lib/email/triggers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Sign up the user (Supabase will create the user but we'll send email via Resend)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${(() => {
          const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
          const protocol = request.headers.get('x-forwarded-proto') || 'https'
          return host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
        })()}/api/auth/callback`,
        // Disable Supabase's default email - we'll send via Resend
        data: {
          skip_email_confirmation: false, // We'll handle this manually
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // If user was created and needs confirmation, send email via Resend
    if (data.user && data.user.email && !data.user.email_confirmed_at) {
      try {
        // Use admin client to generate confirmation link
        const { createAdminClient } = await import('@/lib/supabase/server')
        const adminClient = createAdminClient()
        
        const { data: linkData } = await adminClient.auth.admin.generateLink({
          type: 'signup',
          email: data.user.email,
          password: password, // Required for signup type
        })

        if (linkData?.properties?.action_link) {
          await sendSignupConfirmationEmail(
            data.user.email,
            linkData.properties.action_link
          )
        }
      } catch (emailError) {
        console.error('Failed to send confirmation email via Resend:', emailError)
        // Don't fail the signup if email fails - user can request resend
      }
    }

    return NextResponse.json({ 
      message: 'Account created! Please check your email to confirm your account.',
      user: data.user 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
