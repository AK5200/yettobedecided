import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get webhook to verify org ownership
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('org_id')
      .eq('id', id)
      .single()

    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Verify user is admin of org
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', webhook.org_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Webhook deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Get webhook to verify org ownership
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('org_id')
      .eq('id', id)
      .single()

    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Verify user is admin of org
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', webhook.org_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Whitelist allowed fields to prevent arbitrary field injection
    const allowedFields: Record<string, any> = {}
    if (body.name !== undefined) allowedFields.name = body.name
    if (body.url !== undefined) {
      // Validate URL format
      try {
        const parsed = new URL(body.url)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return NextResponse.json({ error: 'Webhook URL must use http or https' }, { status: 400 })
        }
        allowedFields.url = body.url
      } catch {
        return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
      }
    }
    if (body.events !== undefined) allowedFields.events = body.events
    if (body.secret !== undefined) allowedFields.secret = body.secret
    if (body.is_active !== undefined) allowedFields.is_active = body.is_active

    const { data: updatedWebhook, error: updateError } = await supabase
      .from('webhooks')
      .update({
        ...allowedFields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ webhook: updatedWebhook })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
