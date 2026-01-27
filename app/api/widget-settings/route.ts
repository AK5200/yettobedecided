import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const defaultSettings = {
  widget_type: 'all-in-one',
  position: 'bottom-right',
  accent_color: '#000000',
  button_text: 'Feedback',
  show_branding: true,
  theme: 'light',
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('widget_settings')
    .select('*')
    .eq('org_id', orgId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({
      settings: {
        ...defaultSettings,
        org_id: orgId,
      },
    })
  }

  return NextResponse.json({ settings: data })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body?.org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    // Verify user is member of org
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', body.org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if settings exist for this org
    const { data: existing } = await supabase
      .from('widget_settings')
      .select('id')
      .eq('org_id', body.org_id)
      .single()

    const settingsData = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    let data, error

    if (existing) {
      // Update existing settings
      const { data: updated, error: updateError } = await supabase
        .from('widget_settings')
        .update(settingsData)
        .eq('org_id', body.org_id)
        .select('*')
        .single()
      
      data = updated
      error = updateError
    } else {
      // Insert new settings
      const { data: inserted, error: insertError } = await supabase
        .from('widget_settings')
        .insert({
          ...settingsData,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single()
      
      data = inserted
      error = insertError
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
