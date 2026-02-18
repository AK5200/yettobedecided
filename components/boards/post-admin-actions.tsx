'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MoreHorizontal, Trash2, MessageSquareOff, ThumbsDown, RotateCcw } from 'lucide-react'

interface PostAdminActionsProps {
  postId: string
  isApproved: boolean
  isPinned: boolean
  onUpdate: () => void
}

export function PostAdminActions({
  postId,
  isApproved,
  isPinned,
  onUpdate,
}: PostAdminActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState<'comments' | 'votes' | 'all' | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_approved: true }),
    })
    onUpdate()
    setLoading(false)
  }

  const handleReject = async () => {
    setLoading(true)
    await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_approved: false, admin_note: rejectNote }),
    })
    setShowRejectDialog(false)
    onUpdate()
    setLoading(false)
  }

  const handleTogglePin = async () => {
    setLoading(true)
    await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !isPinned }),
    })
    onUpdate()
    setLoading(false)
  }

  const handleDeletePost = async () => {
    setLoading(true)
    await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
    })
    setShowDeleteDialog(false)
    router.refresh()
    setLoading(false)
  }

  const handleResetComments = async () => {
    setLoading(true)
    await fetch(`/api/posts/${postId}/reset-comments`, {
      method: 'DELETE',
    })
    setShowResetDialog(null)
    onUpdate()
    setLoading(false)
  }

  const handleResetVotes = async () => {
    setLoading(true)
    await fetch(`/api/posts/${postId}/reset-votes`, {
      method: 'DELETE',
    })
    setShowResetDialog(null)
    onUpdate()
    setLoading(false)
  }

  const handleResetAll = async () => {
    setLoading(true)
    await fetch(`/api/posts/${postId}/reset`, {
      method: 'DELETE',
    })
    setShowResetDialog(null)
    onUpdate()
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!isApproved && (
        <Button size="sm" onClick={handleApprove} disabled={loading}>
          Approve
        </Button>
      )}
      {!isApproved && (
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={loading}>
              Reject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Reject Post</DialogTitle>
            </DialogHeader>
            <Textarea
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              placeholder="Reason for rejection"
              className="mb-4"
            />
            <Button onClick={handleReject} disabled={loading}>
              Confirm Reject
            </Button>
          </DialogContent>
        </Dialog>
      )}
      <Button size="sm" variant="secondary" onClick={handleTogglePin} disabled={loading}>
        {isPinned ? 'Unfeature' : 'Feature'}
      </Button>

      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          disabled={loading}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setMenuOpen(!menuOpen)
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border bg-background p-1 shadow-md">
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    setMenuOpen(false)
                    setShowResetDialog('comments')
                  }}
                >
                  <MessageSquareOff className="h-4 w-4 mr-2" />
                  Reset Comments
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    setMenuOpen(false)
                    setShowResetDialog('votes')
                  }}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Reset Votes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    setMenuOpen(false)
                    setShowResetDialog('all')
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
                <div className="h-px bg-border my-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setMenuOpen(false)
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Post Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this post? This will also delete all comments and votes. This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePost} disabled={loading}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={showResetDialog !== null} onOpenChange={() => setShowResetDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {showResetDialog === 'comments' && 'Reset Comments'}
              {showResetDialog === 'votes' && 'Reset Votes'}
              {showResetDialog === 'all' && 'Reset Comments & Votes'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            {showResetDialog === 'comments' && 'Are you sure you want to delete all comments on this post?'}
            {showResetDialog === 'votes' && 'Are you sure you want to reset all votes to 0 on this post?'}
            {showResetDialog === 'all' && 'Are you sure you want to delete all comments and reset votes to 0?'}
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowResetDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (showResetDialog === 'comments') handleResetComments()
                else if (showResetDialog === 'votes') handleResetVotes()
                else if (showResetDialog === 'all') handleResetAll()
              }}
              disabled={loading}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
