'use client'

import { useState, useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Circle, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { PostDetailDialog } from './post-detail-dialog'
import type { Post } from '@/lib/types/database'

interface Status {
  id: string
  key: string
  name: string
  color: string
  order: number
  is_system: boolean
  show_on_roadmap: boolean
}

interface KanbanBoardProps {
  posts: Post[]
  onStatusChange: (postId: string, newStatus: string) => void
  isAdmin?: boolean
  adminEmail?: string
}

// Helper to get background color classes from hex color
const getColorClasses = (hexColor: string) => {
  const colorMap: Record<string, { bg: string; border: string; headerBg: string }> = {
    '#6B7280': { bg: 'bg-gray-50', border: 'border-gray-200', headerBg: 'bg-gray-100' },
    '#3B82F6': { bg: 'bg-blue-50', border: 'border-blue-200', headerBg: 'bg-blue-100' },
    '#F59E0B': { bg: 'bg-amber-50', border: 'border-amber-200', headerBg: 'bg-amber-100' },
    '#10B981': { bg: 'bg-emerald-50', border: 'border-emerald-200', headerBg: 'bg-emerald-100' },
    '#EF4444': { bg: 'bg-red-50', border: 'border-red-200', headerBg: 'bg-red-100' },
    '#8B5CF6': { bg: 'bg-purple-50', border: 'border-purple-200', headerBg: 'bg-purple-100' },
    '#EC4899': { bg: 'bg-pink-50', border: 'border-pink-200', headerBg: 'bg-pink-100' },
    '#6366F1': { bg: 'bg-indigo-50', border: 'border-indigo-200', headerBg: 'bg-indigo-100' },
    '#06B6D4': { bg: 'bg-cyan-50', border: 'border-cyan-200', headerBg: 'bg-cyan-100' },
    '#14B8A6': { bg: 'bg-teal-50', border: 'border-teal-200', headerBg: 'bg-teal-100' },
  }
  return colorMap[hexColor] || { bg: 'bg-gray-50', border: 'border-gray-200', headerBg: 'bg-gray-100' }
}

export function KanbanBoard({ posts, onStatusChange, isAdmin, adminEmail }: KanbanBoardProps) {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loadingStatuses, setLoadingStatuses] = useState(true)
  const [viewMode, setViewMode] = useState<'admin' | 'public'>('admin')

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await fetch('/api/statuses')
        const data = await res.json()
        if (data.statuses) {
          setStatuses(data.statuses)
        }
      } catch (error) {
        console.error('Failed to fetch statuses:', error)
      } finally {
        setLoadingStatuses(false)
      }
    }

    fetchStatuses()
  }, [])

  // Filter statuses based on view mode
  const displayStatuses = viewMode === 'public'
    ? statuses.filter(s => s.show_on_roadmap)
    : statuses

  const grouped = useMemo(() => {
    return displayStatuses.reduce<Record<string, Post[]>>((acc, status) => {
      acc[status.key] = posts.filter((post) => post.status === status.key)
      return acc
    }, {})
  }, [posts, displayStatuses])

  const getAuthorName = (post: Post) => {
    if (post.is_guest) {
      return post.guest_name || 'Guest'
    }
    return post.author_name || 'Anonymous'
  }

  if (loadingStatuses) {
    return <div className="text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      {isAdmin && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {viewMode === 'public' && (
              <span className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-amber-800">
                <Eye className="h-4 w-4" />
                Viewing as public - only showing statuses marked for public roadmap
              </span>
            )}
          </div>
          <Button
            variant={viewMode === 'public' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(viewMode === 'admin' ? 'public' : 'admin')}
            className={viewMode === 'public' ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            {viewMode === 'public' ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Public View
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Admin View
              </>
            )}
          </Button>
        </div>
      )}

      {/* Board */}
      {displayStatuses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {viewMode === 'public'
              ? 'No statuses are set to show on the public roadmap.'
              : 'No statuses found.'}
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.min(displayStatuses.length, 5)}, minmax(0, 1fr))`
          }}
        >
          {displayStatuses.map((status) => {
            const columnPosts = grouped[status.key] || []
            const colors = getColorClasses(status.color)

            return (
              <div
                key={status.id}
                className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 ${colors.headerBg} border-b ${colors.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Circle
                        className="h-4 w-4"
                        style={{ color: status.color, fill: status.color }}
                      />
                      <span className="font-semibold text-gray-900 text-sm">{status.name}</span>
                      {!status.show_on_roadmap && viewMode === 'admin' && (
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                          Private
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {columnPosts.length}
                    </Badge>
                  </div>
                </div>

                {/* Posts */}
                <div className="p-3 min-h-[350px]">
                  {columnPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-xs text-gray-400">No items</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {columnPosts.map((post) => (
                        <PostDetailDialog
                          key={post.id}
                          post={post}
                          isAdmin={isAdmin}
                          adminEmail={adminEmail}
                        >
                          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-gray-300 cursor-pointer transition-all">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                              {post.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-gray-500">
                                <ChevronUp className="h-3 w-3" />
                                <span className="text-xs font-medium">{post.vote_count || 0}</span>
                              </div>
                              {isAdmin && viewMode === 'admin' && (
                                <Select
                                  value={post.status}
                                  onValueChange={(value) => {
                                    onStatusChange(post.id, value)
                                  }}
                                >
                                  <SelectTrigger
                                    className="h-6 w-auto text-[10px] px-2 py-0 border-0 bg-transparent hover:bg-gray-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Circle
                                      className="h-2.5 w-2.5 mr-1"
                                      style={{
                                        color: statuses.find(s => s.key === post.status)?.color,
                                        fill: statuses.find(s => s.key === post.status)?.color
                                      }}
                                    />
                                    <span className="sr-only">Change status</span>
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
                            <p className="text-[10px] text-gray-400 mt-2 truncate">
                              {getAuthorName(post)}
                            </p>
                          </div>
                        </PostDetailDialog>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
