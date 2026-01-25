'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from './post-card'
import type { Post } from '@/lib/types/database'

interface BoardPostsListProps {
  boardId: string
  initialPosts: Post[]
  isAdmin?: boolean
  adminEmail?: string
}

export function BoardPostsList({
  boardId,
  initialPosts,
  isAdmin,
  adminEmail,
}: BoardPostsListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)

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
    return <p className="text-sm text-gray-600">No feedback yet</p>
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onUpdate={fetchPosts}
          isAdmin={isAdmin}
          adminEmail={adminEmail}
        />
      ))}
    </div>
  )
}
