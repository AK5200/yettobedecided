import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { triggerInvitationEmail } from '@/lib/email/triggers'
import crypto from 'crypto'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify user is member of org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { org_id, email, role, invited_by } = body

  if (!org_id || !email) {
    return NextResponse.json({ error: 'org_id and email are required' }, { status: 400 })
  }

  // Verify user is admin/owner of org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      org_id,
      email,
      role: role || 'member',
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
