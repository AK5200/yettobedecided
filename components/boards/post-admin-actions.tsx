'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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
  const [loading, setLoading] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)

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
          <DialogContent>
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
        {isPinned ? 'Unpin' : 'Pin'}
      </Button>
    </div>
  )
}
