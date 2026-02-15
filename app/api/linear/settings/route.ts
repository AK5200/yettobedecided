import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { org_id, auto_sync_enabled } = body

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    if (typeof auto_sync_enabled !== 'boolean') {
      return NextResponse.json({ error: 'auto_sync_enabled must be a boolean' }, { status: 400 })
    }

    // Verify user is a member of the org
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', org_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized for this organization' }, { status: 403 })
    }

    // Update Linear integration settings
    const { error: updateError } = await supabase
      .from('linear_integrations')
      .update({ auto_sync_enabled })
      .eq('org_id', org_id)

    if (updateError) {
      console.error('Failed to update Linear settings:', updateError)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Linear settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
