'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PostStatusSelect } from './post-status-select'
import { PostAdminActions } from './post-admin-actions'
import { PostDetailDialog } from './post-detail-dialog'
import type { Post } from '@/lib/types/database'

interface Tag {
  id: string
  name: string
  color: string
}

interface PostCardProps {
  post: Post
  onUpdate: () => void
  isAdmin?: boolean
  adminEmail?: string
}

export function PostCard({ post, onUpdate, isAdmin, adminEmail }: PostCardProps) {
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    fetch(`/api/posts/${post.id}/tags`)
      .then(res => res.json())
      .then(data => setTags(data.tags || []))
  }, [post.id])
  const handleStatusChange = async (newStatus: string) => {
    await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    onUpdate()
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="w-16 h-16 border rounded flex items-center justify-center text-lg font-semibold">
            {post.vote_count}
          </div>
          <PostDetailDialog post={post} isAdmin={isAdmin} adminEmail={adminEmail}>
            <div className="flex-1 space-y-2 cursor-pointer">
              <div className="flex flex-wrap gap-2">
                {!post.is_approved && <Badge variant="outline">Pending</Badge>}
                {post.is_pinned && <Badge>Pinned</Badge>}
              </div>
              <div className="text-lg font-semibold">{post.title}</div>
              {post.content && <div className="text-sm text-gray-600">{post.content}</div>}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => (
                    <Badge
                      key={tag.id}
                      style={{ backgroundColor: tag.color, color: '#fff' }}
                      className="text-xs px-2 py-0.5"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="text-xs text-gray-600">
                By {post.is_guest ? (post.guest_name || 'Guest') : (post.author_name || 'Anonymous')}
              </div>
              {post.admin_note && (
                <div className="text-sm text-red-600">
                  Rejection note: {post.admin_note}
                </div>
              )}
            </div>
          </PostDetailDialog>
          <div className="flex flex-col gap-3">
            <PostStatusSelect
              postId={post.id}
              currentStatus={post.status}
              onStatusChange={handleStatusChange}
            />
            <PostAdminActions
              postId={post.id}
              isApproved={post.is_approved}
              isPinned={post.is_pinned}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
