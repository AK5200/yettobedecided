'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import type { Comment } from '@/lib/types/database'

interface CommentListProps {
  postId: string
  refreshTrigger?: number
}

export function CommentList({ postId, refreshTrigger }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchComments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (data) {
      setComments(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchComments()
  }, [postId, refreshTrigger])

  if (loading) {
    return <p className="text-sm text-gray-600">Loading comments...</p>
  }

  if (comments.length === 0) {
    return <p className="text-sm text-gray-600">No comments yet</p>
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="border-l-2 border-gray-200 pl-3 py-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>{comment.author_name || 'Anonymous'}</span>
            {comment.is_from_admin && <Badge variant="secondary">Admin</Badge>}
          </div>
          <p className="text-sm text-gray-600">{comment.content}</p>
          <small className="text-xs text-gray-500">
            {new Date(comment.created_at).toLocaleDateString()}
          </small>
        </div>
      ))}
    </div>
  )
}
