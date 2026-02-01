import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoadmapView } from '@/components/roadmap/roadmap-view'

export default async function RoadmapPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/onboarding')
  }

  const isAdmin = membership.role === 'owner' || membership.role === 'admin'

  // Fetch boards for this org
  const { data: boards } = await supabase
    .from('boards')
    .select('id, name')
    .eq('org_id', membership.org_id)
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
      .in('status', ['open', 'planned', 'in_progress', 'shipped', 'closed'])
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
