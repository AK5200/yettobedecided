import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BoardsList } from '@/components/boards/boards-list'

export default async function BoardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    redirect('/onboarding')
  }

  const { data: activeBoards } = await supabase
    .from('boards')
    .select('*')
    .eq('org_id', membership.org_id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  const { data: archivedBoards } = await supabase
    .from('boards')
    .select('*')
    .eq('org_id', membership.org_id)
    .eq('is_archived', true)
    .order('created_at', { ascending: false })

  return (
    <BoardsList
      activeBoards={activeBoards || []}
      archivedBoards={archivedBoards || []}
    />
  )
}
