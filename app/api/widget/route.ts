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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const orgSlug = searchParams.get('org')

  if (!orgSlug) {
    return NextResponse.json({ error: 'org is required' }, { status: 400, headers: corsHeaders })
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404, headers: corsHeaders })
  }

  const { data: settings } = await supabase
    .from('widget_settings')
    .select('*')
    .eq('org_id', org.id)
    .single()

  const { data: boards } = await supabase
    .from('boards')
    .select('id,name,slug')
    .eq('org_id', org.id)
    .eq('is_public', true)

  const { data: changelog } = await supabase
    .from('changelog_entries')
    .select('*')
    .eq('org_id', org.id)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(10)

  return NextResponse.json(
    {
      org,
      settings: settings || { ...defaultSettings, org_id: org.id },
      boards: boards || [],
      changelog: changelog || [],
    },
    { headers: corsHeaders }
  )
}
