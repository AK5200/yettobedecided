import { createClient } from '@/lib/supabase/server'
import { BoardsList } from '@/components/boards/boards-list'

export default async function BoardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in</div>
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return <div>No organization found</div>
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
