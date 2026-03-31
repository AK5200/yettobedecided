import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const context = await getCurrentOrg(supabase)
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { role } = context

  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'You don\'t have permission to perform this action. Admin role required.' }, { status: 403 })
  }

  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
