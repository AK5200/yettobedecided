import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/dashboard'

  // Prevent open redirect: ensure next is a relative path
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    next = '/dashboard'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Auto-accept any pending invitations for this user's email
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const adminClient = createAdminClient()
          const { data: invitations } = await adminClient
            .from('invitations')
            .select('*')
            .ilike('email', user.email)
            .is('accepted_at', null)
            .gt('expires_at', new Date().toISOString())

          if (invitations && invitations.length > 0) {
            for (const invitation of invitations) {
              // Check not already a member
              const { data: existing } = await adminClient
                .from('org_members')
                .select('id')
                .eq('org_id', invitation.org_id)
                .eq('user_id', user.id)
                .single()

              if (!existing) {
                await adminClient
                  .from('org_members')
                  .insert({ org_id: invitation.org_id, user_id: user.id, role: invitation.role })
              }

              await adminClient
                .from('invitations')
                .update({ accepted_at: new Date().toISOString() })
                .eq('id', invitation.id)
            }
            // Skip onboarding — go straight to dashboard
            next = '/dashboard'
          }
        }
      } catch (e) {
        console.error('Auto-accept invitation failed:', e)
        // Don't block the login flow
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
