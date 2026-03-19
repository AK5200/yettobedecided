'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Circle, ChevronUp } from 'lucide-react'
import type { Post } from '@/lib/types/database'

interface Status {
  key: string
  name: string
  color: string
}

interface KanbanColumnProps {
  title: string
  statusKey: string
  color: string
  posts: Post[]
  statuses: Status[]
  onStatusChange: (postId: string, newStatus: string) => void
}

// Helper to get background color classes from hex color
const getColorClasses = (hexColor: string) => {
  const colorMap: Record<string, { bg: string; border: string; headerBg: string }> = {
    '#6B7280': { bg: 'bg-muted/50', border: 'border-border', headerBg: 'bg-muted' },
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
  return colorMap[hexColor] || { bg: 'bg-muted/50', border: 'border-border', headerBg: 'bg-muted' }
}

export function KanbanColumn({
  title,
  statusKey,
  color,
  posts,
  statuses,
  onStatusChange,
}: KanbanColumnProps) {
  const colors = getColorClasses(color)

  const getAuthorName = (post: Post) => {
    if (post.is_guest) {
      return post.guest_name || 'Guest'
    }
    return post.author_name || 'Anonymous'
  }

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}>
      {/* Column Header */}
      <div className={`px-4 py-3 ${colors.headerBg} border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Circle
              className="h-4 w-4"
              style={{ color: color, fill: color }}
            />
            <span className="font-semibold text-foreground text-sm">{title}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {posts.length}
          </Badge>
        </div>
      </div>

      {/* Posts */}
      <div className="p-3 min-h-[350px]">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-muted-foreground/60">No items</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <Card key={post.id} className="bg-card rounded-lg border border-border p-3 shadow-sm hover:shadow-md hover:border-border cursor-pointer transition-all">
                <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                  {post.title}
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <ChevronUp className="h-3 w-3" />
                    <span className="text-xs font-medium">{post.vote_count || 0}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground/80">
                      <Circle
                        className="h-2.5 w-2.5"
                        style={{
                          color: statuses.find(s => s.key === post.status)?.color,
                          fill: statuses.find(s => s.key === post.status)?.color
                        }}
                      />
                      Move
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {statuses
                        .filter((s) => s.key !== statusKey)
                        .map((s) => (
                          <DropdownMenuItem
                            key={s.key}
                            onClick={() => onStatusChange(post.id, s.key)}
                          >
                            <span className="flex items-center gap-2">
                              <Circle
                                className="h-3 w-3"
                                style={{ color: s.color, fill: s.color }}
                              />
                              {s.name}
                            </span>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-2 truncate">
                  {getAuthorName(post)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
