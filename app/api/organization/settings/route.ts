import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { orgId, role } = context

    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.json({ error: 'You don\'t have permission to perform this action. Admin role required.' }, { status: 403 })
    }

    const body = await request.json()

    const { error } = await supabase
      .from('organizations')
      .update({
        post_moderation: body.post_moderation,
        comment_moderation: body.comment_moderation,
        allow_anonymous_posts: body.allow_anonymous_posts,
        allow_guest_posts: body.allow_guest_posts,
        allow_guest_votes: body.allow_guest_votes,
      })
      .eq('id', orgId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
