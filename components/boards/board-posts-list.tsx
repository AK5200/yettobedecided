'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from './post-card'
import { EmptyState } from '@/components/ui/empty-state'
import type { Post } from '@/lib/types/database'

interface BoardPostsListProps {
  boardId: string
  orgId: string
  initialPosts: Post[]
  isAdmin?: boolean
  adminEmail?: string
}

export function BoardPostsList({
  boardId,
  orgId,
  initialPosts,
  isAdmin,
  adminEmail,
}: BoardPostsListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  // Sync posts with initialPosts when filters change
  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const fetchPosts = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('board_id', boardId)
      .order('is_pinned', { ascending: false })
      .order('vote_count', { ascending: false })

    if (data) {
      setPosts(data)
    }
  }

  if (posts.length === 0) {
    return <EmptyState title="No feedback yet" description="Be the first to add feedback." />
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          orgId={orgId}
          onUpdate={fetchPosts}
          isAdmin={isAdmin}
          adminEmail={adminEmail}
        />
      ))}
    </div>
  )
}
