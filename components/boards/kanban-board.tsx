'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Post } from '@/lib/types/database'

interface KanbanBoardProps {
  posts: Post[]
  onStatusChange: (postId: string, newStatus: string) => void
}

const columns = ['open', 'planned', 'in_progress', 'shipped', 'closed'] as const

const columnLabels: Record<(typeof columns)[number], string> = {
  open: 'Open',
  planned: 'Planned',
  in_progress: 'In Progress',
  shipped: 'Shipped',
  closed: 'Closed',
}

export function KanbanBoard({ posts, onStatusChange }: KanbanBoardProps) {
  const grouped = useMemo(() => {
    return columns.reduce<Record<string, Post[]>>((acc, status) => {
      acc[status] = posts.filter((post) => post.status === status)
      return acc
    }, {})
  }, [posts])

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {columns.map((status) => (
        <div key={status} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{columnLabels[status]}</div>
            <Badge variant="secondary">{grouped[status]?.length || 0}</Badge>
          </div>
          <div className="space-y-3">
            {grouped[status]?.map((post) => (
              <Card key={post.id} className="p-3 space-y-2">
                <div className="font-medium text-sm">{post.title}</div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{post.vote_count ?? 0} votes</span>
                  <span>{post.author_name || 'Anonymous'}</span>
                </div>
                <Select
                  value={post.status}
                  onValueChange={(value) => onStatusChange(post.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {columnLabels[col]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
