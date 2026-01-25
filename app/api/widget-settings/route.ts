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
  const supabase = await createClient()
  const body = await request.json()

  if (!body?.org_id) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('widget_settings')
    .upsert(body)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, settings: data })
}
