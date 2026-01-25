import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BoardSettingsForm } from '@/components/settings/board-settings-form'

export default async function BoardSettingsPage({ params }: { params: { id: string } }) {
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
    .single()

  const { data: board } = await supabase
    .from('boards')
    .select('id, name, slug, description, is_public')
    .eq('id', params.id)
    .eq('org_id', membership?.org_id)
    .single()

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Board Settings</h1>
      <BoardSettingsForm
        boardId={board?.id}
        initialValues={{
          name: board?.name || '',
          slug: board?.slug || '',
          description: board?.description || '',
          isPublic: board?.is_public ?? false,
        }}
      />
    </div>
  )
}
