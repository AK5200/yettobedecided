'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Post } from '@/lib/types/database'

interface KanbanColumnProps {
  title: string
  status: string
  posts: Post[]
  onStatusChange: (postId: string, newStatus: string) => void
  accentColor?: string
}

const statuses = ['open', 'planned', 'in_progress', 'shipped', 'closed']

export function KanbanColumn({
  title,
  status,
  posts,
  onStatusChange,
  accentColor = '#000000',
}: KanbanColumnProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 min-h-[400px] space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <Badge variant="outline" style={{ borderColor: accentColor, color: accentColor }}>
          {posts.length}
        </Badge>
      </div>
      <div className="space-y-3">
        {posts.map((post) => (
          <Card key={post.id} className="p-3 space-y-2">
            <div className="font-medium text-sm">{post.title}</div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <Badge variant="outline">{post.vote_count ?? 0} votes</Badge>
              <span>{post.author_name || 'Anonymous'}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="text-xs underline">
                Move to...
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {statuses
                  .filter((value) => value !== status)
                  .map((value) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => onStatusChange(post.id, value)}
                    >
                      {value.replace('_', ' ')}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        ))}
      </div>
    </div>
  )
}
