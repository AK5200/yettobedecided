'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PostDetailDialog } from './post-detail-dialog'
import type { Post } from '@/lib/types/database'
import {
  ChevronUp,
  MessageSquare,
  Pin,
  Calendar,
  MoreVertical,
  Check,
  X as XIcon,
  Circle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface Status {
  id: string
  key: string
  name: string
  color: string
  order: number
}

interface PostCardRedesignProps {
  post: Post
  onUpdate: () => void
  isAdmin?: boolean
  adminEmail?: string
  isPending?: boolean
  statuses: Status[]
}

const statusColors: Record<string, string> = {
  open: '#6B7280',
  in_progress: '#3B82F6',
  planned: '#F59E0B',
  completed: '#10B981',
  closed: '#EF4444',
}

export function PostCardRedesign({
  post,
  onUpdate,
  isAdmin,
  adminEmail,
  isPending = false,
  statuses,
}: PostCardRedesignProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      onUpdate()
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApprove = async () => {
    setIsUpdating(true)
    try {
      await fetch(`/api/posts/${post.id}/approve`, {
        method: 'POST',
      })
      onUpdate()
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async () => {
    setIsUpdating(true)
    try {
      await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      })
      onUpdate()
    } finally {
      setIsUpdating(false)
    }
  }

  const handleTogglePin = async () => {
    setIsUpdating(true)
    try {
      await fetch(`/api/posts/${post.id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !post.is_pinned }),
      })
      onUpdate()
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getAuthorName = () => {
    if (post.is_guest) {
      return post.guest_name || post.guest_email || 'Guest'
    }
    return post.author_name || 'Anonymous'
  }

  const getAuthorInitial = () => {
    const name = getAuthorName()
    return name[0]?.toUpperCase() || 'A'
  }

  const currentStatus = statuses.find(s => s.key === post.status)
  const statusColor = currentStatus?.color || statusColors[post.status] || '#6B7280'

  return (
    <Card className="group relative overflow-hidden border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white">
      <PostDetailDialog post={post} isAdmin={isAdmin} adminEmail={adminEmail}>
        <div className="p-4 cursor-pointer">
          <div className="flex items-start gap-4">
            {/* Vote Button */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <button className="flex flex-col items-center justify-center w-12 h-12 rounded-lg border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all group/vote">
                <ChevronUp className="h-4 w-4 text-gray-500 group-hover/vote:text-amber-600 transition-colors" />
                <span className="text-sm font-semibold text-gray-700 group-hover/vote:text-amber-600 transition-colors">
                  {post.vote_count || 0}
                </span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title & Badges */}
              <div className="flex items-start gap-2 mb-2">
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-amber-600 transition-colors flex-1">
                  {post.title}
                </h3>
                {post.is_pinned && (
                  <Badge variant="secondary" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </Badge>
                )}
              </div>

              {/* Description */}
              {post.content && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {post.content}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                {/* Author */}
                <div className="flex items-center gap-1.5">
                  {post.identified_user_avatar ? (
                    <img
                      src={post.identified_user_avatar}
                      alt=""
                      className="w-5 h-5 rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                      {getAuthorInitial()}
                    </div>
                  )}
                  <span className="font-medium text-gray-700">
                    {getAuthorName()}
                  </span>
                  {post.user_source === 'verified_sso' && (
                    <Badge variant="secondary" className="px-1 py-0 text-[10px] bg-green-50 text-green-700 border-green-200">
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Date */}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(post.created_at)}</span>
                </div>

                {/* Comment Count (if available) */}
                {(post as any).comment_count !== undefined && (post as any).comment_count > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{(post as any).comment_count}</span>
                  </div>
                )}

                {/* Status Badge - only show if no admin dropdown */}
                {!isAdmin && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Circle
                      className="h-2.5 w-2.5"
                      style={{ color: statusColor, fill: statusColor }}
                    />
                    <span className="text-xs font-medium" style={{ color: statusColor }}>
                      {currentStatus?.name || post.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Admin Note (if rejected) */}
              {post.admin_note && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700">
                    <span className="font-medium">Rejection note:</span> {post.admin_note}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            {isAdmin && (
              <div className="flex flex-col gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                {/* Status Select */}
                {!isPending && (
                  <Select
                    value={post.status}
                    onValueChange={handleStatusChange}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs border-gray-200 hover:border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.key} value={status.key}>
                          <div className="flex items-center gap-2">
                            <Circle
                              className="h-2.5 w-2.5"
                              style={{ color: status.color, fill: status.color }}
                            />
                            <span>{status.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Pending Actions */}
                {isPending && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 px-3 gap-1.5 bg-green-600 hover:bg-green-700"
                      onClick={handleApprove}
                      disabled={isUpdating}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                      onClick={handleReject}
                      disabled={isUpdating}
                    >
                      <XIcon className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                )}

                {/* More Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isUpdating}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleTogglePin}>
                      <Pin className="h-4 w-4 mr-2" />
                      {post.is_pinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </PostDetailDialog>
    </Card>
  )
}
