import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { orgId, role } = context

    const body = await request.json()
    const { org_id, name, url, events, secret } = body

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'name, url, and events are required' }, { status: 400 })
    }

    // Validate webhook URL format
    try {
      const parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json({ error: 'Webhook URL must use http or https' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
    }

    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ error: 'You don\'t have permission to perform this action. Admin role required.' }, { status: 403 })
    }

    const resolvedOrgId = org_id || orgId

    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .insert({
        org_id: resolvedOrgId,
        name,
        url,
        secret: secret || null,
        events,
        is_active: true,
      })
      .select()
      .single()

    if (webhookError) {
      return NextResponse.json({ error: webhookError.message }, { status: 500 })
    }

    return NextResponse.json({ webhook }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
