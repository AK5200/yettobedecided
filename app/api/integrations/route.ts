import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

const VALID_TYPES = ['slack', 'discord', 'teams', 'telegram', 'webhook']

export async function POST(request: Request) {
  const supabase = await createClient()
  const context = await getCurrentOrg(supabase)
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { orgId } = context

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

  if (!type) {
    return NextResponse.json({ error: 'type required' }, { status: 400 })
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  // Use org from context (ignore org_id body param if different)
  const resolvedOrgId = org_id || orgId

  // Upsert — UNIQUE(org_id, type) handles insert-or-update
  const { data, error } = await supabase
    .from('integrations')
    .upsert(
      {
        org_id: resolvedOrgId,
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
