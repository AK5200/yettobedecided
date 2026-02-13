import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_TYPES = ['slack', 'discord', 'teams', 'telegram', 'webhook']

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    org_id,
    type,
    webhook_url,
    channel_name,
    notify_on_new_feedback,
    notify_on_status_change,
    notify_on_new_comment,
  } = body

  if (!org_id || !type) {
    return NextResponse.json({ error: 'org_id and type required' }, { status: 400 })
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  // Verify user belongs to this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', org_id)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
  }

  // Upsert — UNIQUE(org_id, type) handles insert-or-update
  const { data, error } = await supabase
    .from('integrations')
    .upsert(
      {
        org_id,
        type,
        webhook_url: webhook_url || null,
        channel_name: channel_name || null,
        notify_on_new_feedback: notify_on_new_feedback ?? true,
        notify_on_status_change: notify_on_status_change ?? true,
        notify_on_new_comment: notify_on_new_comment ?? false,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,type' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
