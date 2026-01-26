import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fireWebhooks } from '@/lib/webhooks/fire'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')
    const publishedOnly = searchParams.get('published_only') === 'true'

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    let query = supabase
      .from('changelog_entries')
      .select('*')
      .eq('org_id', orgId)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (publishedOnly) {
      query = query.eq('is_published', true)
    }

    const { data: entries, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ entries })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { org_id, title, content, category, is_published } = body

    if (!org_id || !title || !content) {
      return NextResponse.json({ error: 'org_id, title, and content are required' }, { status: 400 })
    }

    // Verify user is member of org
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', org_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: entry, error } = await supabase
      .from('changelog_entries')
      .insert({
        org_id,
        title,
        content,
        category: category || 'feature',
        is_published: is_published || false,
        published_at: is_published ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fire webhook for changelog published
    if (is_published) {
      fireWebhooks({
        orgId: org_id,
        event: 'changelog.published',
        payload: entry
      })
    }

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
