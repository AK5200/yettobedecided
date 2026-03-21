import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BoardSettingsPage } from '@/components/settings/board-settings-page'
import { getCurrentOrg } from '@/lib/org-context'

export default async function BoardSettingsRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const orgContext = await getCurrentOrg(supabase)
  if (!orgContext) {
    redirect('/onboarding')
  }

  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgContext.orgId)
    .single()

  if (!board) {
    notFound()
  }

  // Fetch org settings for moderation defaults
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgContext.orgId)
    .single()

  return (
    <BoardSettingsPage
      board={board}
      orgSettings={{
        post_moderation: org?.post_moderation ?? false,
        comment_moderation: org?.comment_moderation ?? false,
        allow_anonymous_posts: org?.allow_anonymous_posts ?? false,
        allow_guest_posts: org?.allow_guest_posts ?? false,
        allow_guest_votes: org?.allow_guest_votes ?? false,
      }}
    />
  )
}
