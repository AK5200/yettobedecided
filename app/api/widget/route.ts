import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { handleOptions, withCors } from '@/lib/cors'

export const dynamic = 'force-dynamic'

const defaultSettings = {
  widget_type: 'all-in-one',
  position: 'bottom-right',
  accent_color: '#000000',
  button_text: 'Feedback',
  show_branding: true,
  theme: 'light',
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const orgSlug = searchParams.get('org')

  if (!orgSlug) {
    return withCors(
      NextResponse.json({ error: 'org is required' }, { status: 400 }),
      origin
    )
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .single()

  if (orgError || !org) {
    return withCors(
      NextResponse.json({ error: 'Organization not found' }, { status: 404 }),
      origin
    )
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

  const response = NextResponse.json({
    org,
    settings: settings || { ...defaultSettings, org_id: org.id },
    boards: boards || [],
    changelog: changelog || [],
  })
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return withCors(response, origin)
}
