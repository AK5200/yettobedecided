import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fireWebhooks } from '@/lib/webhooks/fire'
import { getCurrentOrg } from '@/lib/org-context'

type ChangelogEntryMeta = {
  is_published: boolean
  org_id: string
}

// Helper to add timeout to Supabase queries
async function withTimeout<T>(
  queryPromise: PromiseLike<{ data: T | null; error: any }>,
  timeoutMs: number
): Promise<{ data: T | null; error: any }> {
  const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) => {
    setTimeout(() => {
      resolve({
        data: null,
        error: { message: `Request timeout after ${timeoutMs}ms` },
      })
    }, timeoutMs)
  })

  return Promise.race([queryPromise, timeoutPromise])
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { orgId } = context

    const body = await request.json()
    const { title, content, category, is_published } = body

    // Get old entry to check if publishing status changed and verify it belongs to this org
    const { data: oldEntry, error: fetchError } = await withTimeout<ChangelogEntryMeta>(
      supabase
        .from('changelog_entries')
        .select('is_published, org_id')
        .eq('id', id)
        .single(),
      10000 // 10 second timeout
    )

    if (fetchError) {
      console.error('Error fetching changelog entry:', fetchError)
      return NextResponse.json({ error: fetchError.message || 'Changelog entry not found' }, { status: 404 })
    }

    if (!oldEntry) {
      return NextResponse.json({ error: 'Changelog entry not found' }, { status: 404 })
    }

    if (oldEntry.org_id !== orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content
    if (category !== undefined) updates.category = category
    if (is_published !== undefined) {
      updates.is_published = is_published
      // Only set published_at when transitioning from draft to published
      if (is_published && !oldEntry.is_published) {
        updates.published_at = new Date().toISOString()
      }
    }

    const { data: entry, error } = await withTimeout(
      supabase
        .from('changelog_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single(),
      15000 // 15 second timeout for update
    )

    if (error) {
      console.error('Error updating changelog entry:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fire webhook if changelog was just published (changed from unpublished to published)
    // Don't await - fire and forget to avoid blocking the response
    if (is_published !== undefined && oldEntry && !oldEntry.is_published && is_published && oldEntry.org_id) {
      fireWebhooks({
        orgId: oldEntry.org_id,
        event: 'changelog.published',
        payload: entry
      }).catch(err => {
        console.error('Webhook fire error:', err)
      })
    }

    return NextResponse.json({ entry })
  } catch (error: any) {
    console.error('PATCH changelog error:', error)
    return NextResponse.json({
      error: error?.message || 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { orgId } = context

    // Verify entry exists and belongs to this org
    const { data: entry } = await supabase
      .from('changelog_entries')
      .select('org_id')
      .eq('id', id)
      .single()

    if (!entry) {
      return NextResponse.json({ error: 'Changelog entry not found' }, { status: 404 })
    }

    if (entry.org_id !== orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('changelog_entries')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
