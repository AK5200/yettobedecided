import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { handleOptions, withCors } from '@/lib/cors'
import { getCurrentOrg } from '@/lib/org-context'

export const dynamic = 'force-dynamic'

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

const defaultSettings = {
  widget_type: 'all-in-one',
  position: 'bottom-right',
  accent_color: '#000000',
  button_text: 'Feedback',
  show_branding: true,
  theme: 'light',
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  // Use admin client for GET — this is a public-facing endpoint called from
  // the widget script where visitors are unauthenticated.
  const adminClient = createAdminClient()
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const orgSlug = searchParams.get('org')

  // Support both org_id and org (slug) parameters
  let resolvedOrgId = orgId

  if (!orgId && orgSlug) {
    // Look up org_id from slug
    const { data: org } = await adminClient
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .single()

    if (org) {
      resolvedOrgId = org.id
    }
  }

  if (!resolvedOrgId) {
    return withCors(NextResponse.json({ error: 'org_id or org (slug) is required' }, { status: 400 }), origin)
  }

  const { data, error } = await adminClient
    .from('widget_settings')
    .select('*')
    .eq('org_id', resolvedOrgId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return withCors(NextResponse.json({ error: error.message }, { status: 500 }), origin)
  }

  if (!data) {
    const response = withCors(NextResponse.json({
      settings: {
        ...defaultSettings,
        org_id: resolvedOrgId,
      },
    }), origin)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  }

  const response = withCors(NextResponse.json({ settings: data }), origin)
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  return response
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { orgId } = context

    const body = await request.json()

    if (!body?.org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    if (body.org_id !== orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if settings exist for this org
    const { data: existing } = await supabase
      .from('widget_settings')
      .select('id')
      .eq('org_id', orgId)
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
        .eq('org_id', orgId)
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
