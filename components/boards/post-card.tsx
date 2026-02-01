'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PostStatusSelect } from './post-status-select'
import { PostAdminActions } from './post-admin-actions'
import { PostDetailDialog } from './post-detail-dialog'
import { TagSelector } from '@/components/tags/tag-selector'
import type { Post } from '@/lib/types/database'

function formatDate(dateString?: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface PostCardProps {
  post: Post
  orgId: string
  onUpdate: () => void
  isAdmin?: boolean
  adminEmail?: string
}

export function PostCard({ post, orgId, onUpdate, isAdmin, adminEmail }: PostCardProps) {
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
        {/* Top row with TagSelector on right */}
        <div className="flex justify-end mb-2">
          <TagSelector postId={post.id} orgId={orgId} />
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="w-16 h-16 border rounded flex items-center justify-center text-lg font-semibold">
            {post.vote_count}
          </div>
          <PostDetailDialog post={post} isAdmin={isAdmin} adminEmail={adminEmail}>
            <div className="flex-1 space-y-2 cursor-pointer">
              <div className="flex flex-wrap gap-2">
                {!post.is_approved && <Badge variant="outline">Pending</Badge>}
                {post.is_pinned && <Badge>Featured</Badge>}
              </div>
              <div className="text-lg font-semibold">{post.title}</div>
              {post.content && <div className="text-sm text-gray-600">{post.content}</div>}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  {post.identified_user_avatar ? (
                    <img
                      src={post.identified_user_avatar}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                      {(post.is_guest ? (post.guest_name || post.guest_email || 'G') : (post.author_name || 'A'))[0].toUpperCase()}
                    </div>
                  )}
                  <span>
                    {post.is_guest ? (post.guest_name || post.guest_email || 'Guest') : (post.author_name || 'Anonymous')}
                  </span>
                  {post.user_source === 'verified_sso' && (
                    <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Verified</span>
                  )}
                </div>
                <span>•</span>
                <span>{formatDate(post.created_at)}</span>
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
