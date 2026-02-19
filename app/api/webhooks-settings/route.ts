import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { org_id, name, url, events, secret } = body

    if (!org_id || !name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'org_id, name, url, and events are required' }, { status: 400 })
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

    // Verify user is admin of org
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', org_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .insert({
        org_id,
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
