'use client'

import React, { useState, useEffect } from 'react'
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
import { TagSelector } from '@/components/tags/tag-selector'
import { createClient } from '@/lib/supabase/client'
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
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    // Fetch org_id from board
    const fetchOrgId = async () => {
      const supabase = createClient()
      const { data: board } = await supabase
        .from('boards')
        .select('org_id')
        .eq('id', post.board_id)
        .single()
      
      if (board?.org_id) {
        setOrgId(board.org_id)
      }
    }
    
    fetchOrgId()
  }, [post.board_id])

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
        {isAdmin && orgId && (
          <div className="mt-4">
            <label className="text-sm font-medium">Tags</label>
            <TagSelector postId={post.id} orgId={orgId} />
          </div>
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
