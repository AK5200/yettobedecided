import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { token } = body
  const supabase = await createClient()

  // Authenticate user - user_id must come from auth, not request body
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'You must be logged in to accept an invitation' }, { status: 401 })
  }
  const user_id = user.id

  // Use admin client to bypass RLS — the invited user isn't an org member yet,
  // so RLS would block reads on invitations and inserts on org_members
  const adminClient = createAdminClient()

  const { data: invitation, error: findError } = await adminClient
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .single()
  if (findError || !invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
  }
  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })
  }

  // Check if user is already a member
  const { data: existing } = await adminClient
    .from('org_members')
    .select('id')
    .eq('org_id', invitation.org_id)
    .eq('user_id', user_id)
    .single()
  if (existing) {
    // Mark invitation as accepted even if already a member
    await adminClient.from('invitations').update({ accepted_at: new Date().toISOString() }).eq('id', invitation.id)
    return NextResponse.json({ success: true, org_id: invitation.org_id })
  }

  const { error: memberError } = await adminClient
    .from('org_members')
    .insert({ org_id: invitation.org_id, user_id, role: invitation.role })
  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  const { error: updateError } = await adminClient
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)
  if (updateError) {
    console.error('Failed to mark invitation as accepted:', updateError)
  }

  return NextResponse.json({ success: true, org_id: invitation.org_id })
}
