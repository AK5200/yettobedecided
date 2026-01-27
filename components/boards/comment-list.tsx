'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'
import type { Comment } from '@/lib/types/database'

interface CommentListProps {
  postId: string
  isAdmin?: boolean
  refreshTrigger?: number
}

export function CommentList({ postId, isAdmin, refreshTrigger }: CommentListProps) {
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
      {comments
        .filter(c => !c.is_internal || isAdmin)
        .map((comment) => (
          <div
            key={comment.id}
            className={`p-3 rounded border-l-2 ${comment.is_internal
                ? 'bg-yellow-50 border-yellow-200 border-l-yellow-600'
                : 'border-gray-200 bg-gray-50/50'
              }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{comment.author_name || 'Anonymous'}</span>
                {comment.is_from_admin && <Badge variant="secondary">Admin</Badge>}
              </div>
              {comment.is_internal && (
                <span className='text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold tracking-tight uppercase'>
                  <Lock className='w-3 h-3' />
                  Internal
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">{comment.content}</p>
            <small className="text-[10px] text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </small>
          </div>
        ))}
    </div>
  )
}
