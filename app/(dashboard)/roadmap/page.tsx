import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentOrg } from '@/lib/org-context'
import { RoadmapView } from '@/components/roadmap/roadmap-view'

export default async function RoadmapPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const orgContext = await getCurrentOrg(supabase)
  if (!orgContext) {
    redirect('/onboarding')
  }

  const isAdmin = orgContext.role === 'owner' || orgContext.role === 'admin'

  // Fetch boards for this org
  const { data: boards } = await supabase
    .from('boards')
    .select('id, name')
    .eq('org_id', orgContext.orgId)
    .eq('is_archived', false)

  let posts: any[] = []

  if (boards && boards.length > 0) {
    // Fetch all posts for roadmap
    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .in('board_id', boards.map(b => b.id))
      .eq('is_approved', true)
      .neq('status', 'merged')
      .is('merged_into_id', null)
      .order('vote_count', { ascending: false })

    if (error) {
      console.error('Roadmap posts fetch error:', error)
    }

    // Add board name to each post
    const boardMap = Object.fromEntries(boards.map(b => [b.id, b.name]))
    posts = (postsData || []).map(post => ({
      ...post,
      board_name: boardMap[post.board_id] || 'Unknown'
    }))
  }

  return <RoadmapView posts={posts} isAdmin={isAdmin} adminEmail={user.email} />
}
