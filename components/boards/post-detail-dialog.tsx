'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
import { MergeModal } from '@/components/posts/merge-modal'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Circle } from 'lucide-react'

interface PostDetailDialogProps {
  post: Post
  isAdmin?: boolean
  adminEmail?: string
  children: React.ReactNode
}

interface Status {
  id: string
  key: string
  name: string
  color: string
  order: number
  is_system: boolean
  show_on_roadmap: boolean
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PostDetailDialog({
  post,
  isAdmin,
  adminEmail,
  children,
}: PostDetailDialogProps) {
  const router = useRouter()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>(post.status)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statuses, setStatuses] = useState<Status[]>([])

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

  useEffect(() => {
    // Fetch dynamic statuses
    const fetchStatuses = async () => {
      try {
        const res = await fetch('/api/statuses')
        const data = await res.json()
        if (data.statuses) {
          setStatuses(data.statuses)
        }
      } catch (error) {
        console.error('Failed to fetch statuses:', error)
      }
    }

    fetchStatuses()
  }, [])

  const handleCommentAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setCurrentStatus(newStatus)
        const statusObj = statuses.find(s => s.key === newStatus)
        toast.success(`Status updated to ${statusObj?.name || newStatus}`)
        router.refresh()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getCurrentStatusDisplay = () => {
    const status = statuses.find(s => s.key === currentStatus)
    if (status) {
      return (
        <span className="flex items-center gap-2">
          <Circle className="h-4 w-4" style={{ color: status.color, fill: status.color }} />
          {status.name}
        </span>
      )
    }
    return currentStatus
  }

  const handleSyncLinear = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/sync-linear`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Synced to Linear!')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to sync')
      }
    } catch (error) {
      toast.error('Failed to sync')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post.title}</DialogTitle>
        </DialogHeader>
        {post.content && <div className="text-sm text-gray-600">{post.content}</div>}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {isAdmin && statuses.length > 0 ? (
            <Select value={currentStatus} onValueChange={handleStatusChange} disabled={updatingStatus}>
              <SelectTrigger className="w-40">
                <SelectValue>
                  {getCurrentStatusDisplay()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.key} value={status.key}>
                    <span className="flex items-center gap-2">
                      <Circle className="h-4 w-4" style={{ color: status.color, fill: status.color }} />
                      {status.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="secondary">
              {statuses.find(s => s.key === post.status)?.name || post.status}
            </Badge>
          )}
          <Badge variant="outline">{post.vote_count} votes</Badge>
        </div>
        <p className="text-sm text-gray-500">
          By {post.is_guest ? (post.guest_name || 'Guest') : (post.author_name || 'Anonymous')} • {formatDate(post.created_at)}
        </p>
        {post.admin_note && (
          <p className="text-sm text-red-600">{post.admin_note}</p>
        )}
        {isAdmin && orgId && (
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">Tags</label>
              <TagSelector postId={post.id} orgId={orgId} />
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMergeOpen(true)}
                className="w-full flex items-center justify-center gap-2"
              >
                Merge Duplicate post
              </Button>
              {!post.linear_issue_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncLinear}
                  disabled={syncing}
                  className="w-full flex items-center justify-center gap-2 mt-2"
                >
                  {syncing ? 'Syncing...' : 'Sync to Linear'}
                </Button>
              )}
              {post.linear_issue_url && (
                <a href={post.linear_issue_url} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2 mt-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                  >
                    View in Linear
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
        {isAdmin && (
          <MergeModal
            open={mergeOpen}
            onClose={() => setMergeOpen(false)}
            sourcePost={{ id: post.id, title: post.title, content: post.content || '', vote_count: post.vote_count || 0 }}
            boardId={post.board_id}
            onMerged={() => {
              router.refresh()
            }}
          />
        )}
        <Separator className="my-4" />
        <h3 className="font-semibold mb-2">Comments</h3>
        <CommentList postId={post.id} isAdmin={isAdmin} refreshTrigger={refreshTrigger} userEmail={adminEmail} />
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
