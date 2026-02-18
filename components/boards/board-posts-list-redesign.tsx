'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostCardRedesign } from './post-card-redesign'
import type { Post } from '@/lib/types/database'
import type { Status } from './post-card-redesign'
import { MessageSquare, Sparkles } from 'lucide-react'

interface BoardPostsListRedesignProps {
  boardId: string
  orgId: string
  pendingPosts: Post[]
  approvedPosts: Post[]
  adminEmail: string
  statuses: Status[]
}

export function BoardPostsListRedesign({
  boardId,
  orgId,
  pendingPosts,
  approvedPosts,
  adminEmail,
  statuses,
}: BoardPostsListRedesignProps) {
  const [pending, setPending] = useState<Post[]>(pendingPosts)
  const [approved, setApproved] = useState<Post[]>(approvedPosts)

  useEffect(() => {
    setPending(pendingPosts)
  }, [pendingPosts])

  useEffect(() => {
    setApproved(approvedPosts)
  }, [approvedPosts])

  const fetchPosts = async () => {
    const supabase = createClient()

    const { data: pendingData } = await supabase
      .from('posts')
      .select('*')
      .eq('board_id', boardId)
      .eq('is_approved', false)
      .neq('status', 'merged')
      .order('created_at', { ascending: false })

    const { data: approvedData } = await supabase
      .from('posts')
      .select('*')
      .eq('board_id', boardId)
      .eq('is_approved', true)
      .neq('status', 'merged')
      .order('is_pinned', { ascending: false })
      .order('vote_count', { ascending: false })

    if (pendingData) setPending(pendingData)
    if (approvedData) setApproved(approvedData)
  }

  const totalPosts = pending.length + approved.length

  if (totalPosts === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No feedback yet
        </h3>
        <p className="text-gray-600 text-sm">
          Be the first to add feedback to this board
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Pending Posts */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-amber-900">
                Pending Approval
              </h2>
              <span className="text-xs text-amber-700 font-medium">
                {pending.length}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {pending.map((post) => (
              <PostCardRedesign
                key={post.id}
                post={post}
                onUpdate={fetchPosts}
                isAdmin={true}
                adminEmail={adminEmail}
                isPending={true}
                statuses={statuses}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved Posts */}
      {approved.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              All Feedback
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              {approved.length}
            </span>
          </div>
          <div className="space-y-3">
            {approved.map((post) => (
              <PostCardRedesign
                key={post.id}
                post={post}
                onUpdate={fetchPosts}
                isAdmin={true}
                adminEmail={adminEmail}
                isPending={false}
                statuses={statuses}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
