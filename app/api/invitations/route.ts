import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { triggerInvitationEmail } from '@/lib/email/triggers'
import { getCurrentOrg } from '@/lib/org-context'
import crypto from 'crypto'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })

  const supabase = await createClient()
  const context = await getCurrentOrg(supabase)
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (context.orgId !== orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('org_id', orgId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invitations: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const context = await getCurrentOrg(supabase)
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { orgId, role } = context

  const body = await request.json()
  const { email, role: inviteRole, invited_by } = body

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'You don\'t have permission to perform this action. Admin role required.' }, { status: 403 })
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      org_id: orgId,
      email,
      role: inviteRole || 'member',
      invited_by,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Trigger email
  try {
    const { headers } = request
    const host = headers.get('x-forwarded-host') || headers.get('host') || ''
    const protocol = headers.get('x-forwarded-proto') || 'https'
    const baseUrl = `${protocol}://${host}`
    await triggerInvitationEmail(email, token, invited_by, baseUrl);
  } catch (e) {
    console.error('Failed to send invitation email:', e);
  }

  return NextResponse.json({ invitation: data })
}
