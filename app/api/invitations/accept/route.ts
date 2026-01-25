import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { token, user_id } = body
  const supabase = await createClient()
  const { data: invitation, error: findError } = await supabase
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
  const { error: memberError } = await supabase
    .from('org_members')
    .insert({ org_id: invitation.org_id, user_id, role: invitation.role })
  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })
  await supabase.from('invitations').update({ accepted_at: new Date().toISOString() }).eq('id', invitation.id)
  return NextResponse.json({ success: true, org_id: invitation.org_id })
}
