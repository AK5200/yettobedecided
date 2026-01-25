'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CommentList } from './comment-list'
import { CommentForm } from './comment-form'
import type { Post } from '@/lib/types/database'

interface PostDetailDialogProps {
  post: Post
  isAdmin?: boolean
  adminEmail?: string
  children: React.ReactNode
}

export function PostDetailDialog({
  post,
  isAdmin,
  adminEmail,
  children,
}: PostDetailDialogProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCommentAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post.title}</DialogTitle>
        </DialogHeader>
        {post.content && <div className="text-sm text-gray-600">{post.content}</div>}
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary">{post.status}</Badge>
          <Badge variant="outline">{post.vote_count} votes</Badge>
        </div>
        <p className="text-sm text-gray-600">
          By {post.author_name || 'Anonymous'}
        </p>
        {post.admin_note && (
          <p className="text-sm text-red-600">{post.admin_note}</p>
        )}
        <Separator className="my-4" />
        <h3 className="font-semibold mb-2">Comments</h3>
        <CommentList postId={post.id} refreshTrigger={refreshTrigger} />
        <Separator className="my-4" />
        <CommentForm
          postId={post.id}
          isAdmin={isAdmin}
          authorEmail={adminEmail}
          authorName={isAdmin ? 'Admin' : undefined}
          onCommentAdded={handleCommentAdded}
        />
      </DialogContent>
    </Dialog>
  )
}
