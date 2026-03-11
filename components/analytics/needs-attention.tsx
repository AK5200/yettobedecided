'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, Clock, ChevronRight } from 'lucide-react'
import { PostDetailDialog } from '@/components/boards/post-detail-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Post } from '@/lib/types/database'

interface StalePost extends Post {
  days_stale: number
}

interface NeedsAttentionProps {
  orgId: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: 'text-blue-700', bg: 'bg-blue-50' },
  planned: { label: 'Planned', color: 'text-violet-700', bg: 'bg-violet-50' },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-amber-50' },
}

export function NeedsAttention({ orgId }: NeedsAttentionProps) {
  const [dismissed, setDismissed] = useState(false)
  const [stalePosts, setStalePosts] = useState<StalePost[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/analytics/stale?org_id=${orgId}`)
        if (res.ok) {
          const json = await res.json()
          setStalePosts(json.posts || [])
        }
      } catch (error) {
        console.error('Failed to fetch stale posts:', error)
      }
    }

    if (orgId) {
      fetchData()
    }
  }, [orgId])

  if (dismissed || stalePosts.length === 0) {
    return null
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-5 flex items-center justify-between shadow-md">
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-4 cursor-pointer text-left flex-1">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 mb-1">
                {stalePosts.length} {stalePosts.length === 1 ? 'post' : 'posts'} need attention
              </p>
              <p className="text-xs text-amber-800">
                Some posts haven&apos;t been updated in over 30 days &mdash; click to view
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-amber-500 ml-auto" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-lg p-0 gap-0 rounded-xl overflow-hidden border-gray-200">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Posts needing attention
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              These posts haven&apos;t been updated in over 30 days
            </p>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {stalePosts.map((post) => {
              const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.open
              return (
                <PostDetailDialog key={post.id} post={post} isAdmin>
                  <div className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock className="h-3 w-3" />
                          {post.days_stale}d ago
                        </span>
                        <span className="text-[11px] text-gray-400">
                          &middot; {post.vote_count || 0} votes
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </div>
                </PostDetailDialog>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
      <button
        onClick={() => setDismissed(true)}
        className="p-2 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer ml-3 shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5 text-amber-600" />
      </button>
    </div>
  )
}
