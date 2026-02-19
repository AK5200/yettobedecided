import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!member?.org_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { reason } = await request.json()
  const admin = createAdminClient()

  const { data: widgetUser } = await admin
    .from('widget_users')
    .select('id, org_id')
    .eq('id', id)
    .single()

  if (!widgetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (widgetUser.org_id !== member.org_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .from('widget_users')
    .update({
      is_banned: true,
      banned_at: new Date().toISOString(),
      banned_reason: reason || null,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!member?.org_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: widgetUser } = await admin
    .from('widget_users')
    .select('id, org_id')
    .eq('id', id)
    .single()

  if (!widgetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (widgetUser.org_id !== member.org_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .from('widget_users')
    .update({
      is_banned: false,
      banned_at: null,
      banned_reason: null,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
