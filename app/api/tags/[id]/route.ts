import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get the tag to find its org_id
  const { data: tag } = await supabase.from('tags').select('org_id').eq('id', id).single()
  if (!tag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 })

  // Verify user is admin/owner of the tag's org
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', tag.org_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
