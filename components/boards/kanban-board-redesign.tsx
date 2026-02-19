'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Circle, ChevronUp, Eye, EyeOff, Calendar, MessageSquare, Pin } from 'lucide-react'
import { PostDetailDialog } from './post-detail-dialog'
import type { Post } from '@/lib/types/database'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Status {
  id: string
  key: string
  name: string
  color: string
  order: number
  is_system?: boolean
  show_on_roadmap?: boolean
}

interface KanbanBoardRedesignProps {
  posts: Post[]
  isAdmin?: boolean
  adminEmail?: string
  boardId: string
  statuses: Status[]
}

const getColorClasses = (hexColor: string) => {
  const colorMap: Record<string, { bg: string; border: string; text: string; headerBg: string }> = {
    '#6B7280': { bg: 'bg-gray-50/50', border: 'border-gray-200', text: 'text-gray-700', headerBg: 'bg-gray-50' },
    '#3B82F6': { bg: 'bg-blue-50/30', border: 'border-blue-200', text: 'text-blue-700', headerBg: 'bg-blue-50' },
    '#F59E0B': { bg: 'bg-amber-50/30', border: 'border-amber-200', text: 'text-amber-700', headerBg: 'bg-amber-50' },
    '#10B981': { bg: 'bg-emerald-50/30', border: 'border-emerald-200', text: 'text-emerald-700', headerBg: 'bg-emerald-50' },
    '#EF4444': { bg: 'bg-red-50/30', border: 'border-red-200', text: 'text-red-700', headerBg: 'bg-red-50' },
    '#8B5CF6': { bg: 'bg-purple-50/30', border: 'border-purple-200', text: 'text-purple-700', headerBg: 'bg-purple-50' },
    '#EC4899': { bg: 'bg-pink-50/30', border: 'border-pink-200', text: 'text-pink-700', headerBg: 'bg-pink-50' },
    '#6366F1': { bg: 'bg-indigo-50/30', border: 'border-indigo-200', text: 'text-indigo-700', headerBg: 'bg-indigo-50' },
    '#06B6D4': { bg: 'bg-cyan-50/30', border: 'border-cyan-200', text: 'text-cyan-700', headerBg: 'bg-cyan-50' },
    '#14B8A6': { bg: 'bg-teal-50/30', border: 'border-teal-200', text: 'text-teal-700', headerBg: 'bg-teal-50' },
  }
  return colorMap[hexColor] || { bg: 'bg-gray-50/50', border: 'border-gray-200', text: 'text-gray-700', headerBg: 'bg-gray-50' }
}

export function KanbanBoardRedesign({ posts, isAdmin, adminEmail, boardId, statuses }: KanbanBoardRedesignProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'admin' | 'public'>('admin')

  const displayStatuses = viewMode === 'public'
    ? statuses.filter(s => s.show_on_roadmap)
    : statuses

  const grouped = useMemo(() => {
    return displayStatuses.reduce<Record<string, Post[]>>((acc, status) => {
      acc[status.key] = posts.filter((post) => post.status === status.key)
      return acc
    }, {})
  }, [posts, displayStatuses])

  const handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) {
        toast.error('Failed to update status')
        console.error('Failed to update status:', response.statusText)
        return
      }
      router.refresh()
    } catch (error) {
      toast.error('Failed to update status')
      console.error('Failed to update status:', error)
    }
  }

  const getAuthorName = (post: Post) => {
    if (post.is_guest) {
      return post.guest_name || 'Guest'
    }
    return post.author_name || 'Anonymous'
  }

  const getAuthorInitial = (post: Post) => {
    const name = getAuthorName(post)
    return name[0]?.toUpperCase() || 'A'
  }

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      {isAdmin && (
        <div className="flex items-center justify-between">
          <div>
            {viewMode === 'public' && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-amber-800">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Public View — Only showing statuses marked for public roadmap
                </span>
              </div>
            )}
          </div>
          <Button
            variant={viewMode === 'public' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(viewMode === 'admin' ? 'public' : 'admin')}
            className={`gap-2 ${viewMode === 'public' ? 'bg-amber-500 hover:bg-amber-600' : 'border-gray-200 hover:bg-gray-50'}`}
          >
            {viewMode === 'public' ? (
              <>
                <Eye className="h-4 w-4" />
                Public View
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Switch to Public
              </>
            )}
          </Button>
        </div>
      )}

      {/* Kanban Board */}
      {displayStatuses.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">
            {viewMode === 'public'
              ? 'No statuses are set to show on the public roadmap.'
              : 'No statuses found.'}
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {displayStatuses.map((status) => {
            const columnPosts = grouped[status.key] || []
            const colors = getColorClasses(status.color)
            const totalVotes = columnPosts.reduce((sum, post) => sum + (post.vote_count || 0), 0)

            return (
              <div
                key={status.id}
                className="flex-shrink-0 w-[340px]"
              >
                {/* Column */}
                <div className={`rounded-xl border ${colors.border} bg-white overflow-hidden h-full flex flex-col`}>
                  {/* Header */}
                  <div className={`px-4 py-3 ${colors.headerBg} border-b ${colors.border}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Circle
                          className="h-3 w-3"
                          style={{ color: status.color, fill: status.color }}
                        />
                        <span className={`font-semibold text-sm ${colors.text}`}>
                          {status.name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {columnPosts.length}
                      </Badge>
                    </div>
                    {!status.show_on_roadmap && viewMode === 'admin' && (
                      <Badge variant="secondary" className="text-[10px] bg-gray-200 text-gray-600">
                        Private
                      </Badge>
                    )}
                    {columnPosts.length > 0 && (
                      <div className="text-[11px] text-gray-500 mt-1">
                        {totalVotes} total votes
                      </div>
                    )}
                  </div>

                  {/* Posts */}
                  <div className={`p-3 space-y-3 flex-1 overflow-y-auto ${colors.bg}`} style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}>
                    {columnPosts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center mb-2">
                          <Circle className="h-6 w-6 text-gray-300" style={{ color: status.color, opacity: 0.4 }} />
                        </div>
                        <p className="text-xs text-gray-400">No items</p>
                      </div>
                    ) : (
                      columnPosts.map((post) => (
                        <PostDetailDialog
                          key={post.id}
                          post={post}
                          isAdmin={isAdmin}
                          adminEmail={adminEmail}
                        >
                          <Card className="group cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200 border-gray-200 bg-white">
                            <div className="p-3">
                              {/* Top: Title & Pin */}
                              <div className="flex items-start gap-2 mb-2">
                                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1 group-hover:text-gray-700 transition-colors">
                                  {post.title}
                                </h4>
                                {post.is_pinned && (
                                  <Pin className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                                )}
                              </div>

                              {/* Description */}
                              {post.content && (
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                                  {post.content}
                                </p>
                              )}

                              {/* Footer */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                {/* Left: Votes & Comments */}
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <ChevronUp className="h-3.5 w-3.5" />
                                    <span className="text-xs font-semibold">{post.vote_count || 0}</span>
                                  </div>
                                  {(post as any).comment_count !== undefined && (post as any).comment_count > 0 && (
                                    <div className="flex items-center gap-1 text-gray-500">
                                      <MessageSquare className="h-3.5 w-3.5" />
                                      <span className="text-xs font-medium">{(post as any).comment_count}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Right: Status Select (Admin Only) */}
                                {isAdmin && viewMode === 'admin' && (
                                  <Select
                                    value={post.status}
                                    onValueChange={(value) => {
                                      handleStatusChange(post.id, value)
                                    }}
                                  >
                                    <SelectTrigger
                                      className="h-6 w-auto text-[10px] px-2 py-0 border-0 bg-transparent hover:bg-gray-100 rounded"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Circle
                                        className="h-2.5 w-2.5 mr-1"
                                        style={{
                                          color: statuses.find(s => s.key === post.status)?.color,
                                          fill: statuses.find(s => s.key === post.status)?.color
                                        }}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {statuses.map((s) => (
                                        <SelectItem key={s.key} value={s.key}>
                                          <span className="flex items-center gap-2">
                                            <Circle
                                              className="h-3 w-3"
                                              style={{ color: s.color, fill: s.color }}
                                            />
                                            {s.name}
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>

                              {/* Author & Date */}
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                                {post.identified_user_avatar ? (
                                  <img
                                    src={post.identified_user_avatar}
                                    alt=""
                                    className="w-4 h-4 rounded-full border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[9px] font-medium text-gray-600">
                                    {getAuthorInitial(post)}
                                  </div>
                                )}
                                <span className="text-[10px] text-gray-500 font-medium truncate flex-1">
                                  {getAuthorName(post)}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {formatDate(post.created_at)}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </PostDetailDialog>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
