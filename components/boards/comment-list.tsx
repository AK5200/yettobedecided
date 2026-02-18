'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Lock, Pencil, Trash2 } from 'lucide-react'
import type { Comment } from '@/lib/types/database'

interface CommentWithUser extends Comment {
  widget_users?: {
    avatar_url: string | null
    name: string | null
    email: string | null
    user_source: string | null
    company_name: string | null
  } | null
}

interface CommentListProps {
  postId: string
  isAdmin?: boolean
  refreshTrigger?: number
  userEmail?: string
}

export function CommentList({ postId, isAdmin, refreshTrigger, userEmail }: CommentListProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchComments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('*, widget_users(avatar_url, name, email, user_source, company_name)')
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

  const handleEditComment = async () => {
    if (!editingComment || !editContent.trim()) return
    setActionLoading(true)
    await fetch(`/api/comments/${editingComment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent, author_email: userEmail }),
    })
    setEditingComment(null)
    setEditContent('')
    await fetchComments()
    setActionLoading(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    setActionLoading(true)
    await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_email: userEmail }),
    })
    setDeleteConfirm(null)
    await fetchComments()
    setActionLoading(false)
  }

  const openEditDialog = (comment: Comment) => {
    setEditingComment(comment)
    setEditContent(comment.content)
  }

  if (loading) {
    return <p className="text-sm text-gray-600">Loading comments...</p>
  }

  if (comments.length === 0) {
    return <p className="text-sm text-gray-600">No comments yet</p>
  }

  return (
    <>
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
                <div className="flex items-center gap-2">
                  {comment.widget_users?.avatar_url ? (
                    <img
                      src={comment.widget_users.avatar_url}
                      alt={comment.widget_users.name || comment.widget_users.email || 'User'}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                      {(comment.widget_users?.name || comment.author_name || comment.author_email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium">
                    {comment.widget_users?.name || comment.author_name || comment.author_email || 'Anonymous'}
                  </span>
                  {comment.widget_users?.user_source === 'verified_jwt' && (
                    <Badge className="bg-green-100 text-green-700 text-[10px]">Verified</Badge>
                  )}
                  {comment.widget_users?.company_name && (
                    <Badge variant="secondary" className="text-[10px]">
                      {comment.widget_users.company_name}
                    </Badge>
                  )}
                  {comment.is_from_admin && <Badge variant="secondary">Admin</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  {comment.is_internal && (
                    <span className='text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold tracking-tight uppercase'>
                      <Lock className='w-3 h-3' />
                      Internal
                    </span>
                  )}
                  {(() => {
                    const isOwnComment = userEmail && comment.author_email &&
                      userEmail.toLowerCase() === comment.author_email.toLowerCase()
                    const canEdit = isOwnComment || (isAdmin && comment.is_from_admin)
                    const canDelete = isOwnComment || isAdmin

                    if (!canEdit && !canDelete) return null

                    return (
                      <div className="flex gap-1 ml-2">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => openEditDialog(comment)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                            onClick={() => setDeleteConfirm(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{comment.content}</p>
              <small className="text-[10px] text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </small>
            </div>
          ))}
      </div>

      {/* Edit Comment Dialog */}
      <Dialog open={editingComment !== null} onOpenChange={() => setEditingComment(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Edit your comment..."
            className="mb-4"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditingComment(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditComment} disabled={actionLoading || !editContent.trim()}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this comment? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteComment(deleteConfirm)}
              disabled={actionLoading}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
