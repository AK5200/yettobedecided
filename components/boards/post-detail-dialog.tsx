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
import {
  Circle,
  ChevronUp,
  Calendar,
  User,
  MessageSquare,
  GitMerge,
  ExternalLink,
  Tag,
} from 'lucide-react'

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

// Inner component that only mounts when dialog is open — all fetching happens here
function PostDetailContent({
  post,
  isAdmin,
  adminEmail,
}: {
  post: Post
  isAdmin?: boolean
  adminEmail?: string
}) {
  const router = useRouter()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>(post.status)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statuses, setStatuses] = useState<Status[]>([])

  useEffect(() => {
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
          <Circle className="h-3.5 w-3.5" style={{ color: status.color, fill: status.color }} />
          {status.name}
        </span>
      )
    }
    return currentStatus
  }

  const currentStatusObj = statuses.find(s => s.key === currentStatus)

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 min-h-0" style={{ height: 'calc(85vh - 80px)' }}>
      {/* Left Column — Content + Comments */}
      <div className="flex-1 min-w-0 flex flex-col pr-0 lg:pr-6 lg:border-r lg:border-gray-100 overflow-hidden">
        {/* Title */}
        <DialogHeader className="mb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-gray-900 leading-tight">
            {post.title}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable area: content + comments */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Content */}
          {post.content && (
            <div className="text-sm text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
              {post.content}
            </div>
          )}

          {/* Admin Note */}
          {post.admin_note && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <span className="font-semibold">Admin note:</span> {post.admin_note}
              </p>
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Comments</h3>
            </div>
            <CommentList postId={post.id} isAdmin={isAdmin} refreshTrigger={refreshTrigger} userEmail={adminEmail} />
          </div>
        </div>

        {/* Fixed comment form at bottom */}
        <div className="flex-shrink-0 pt-4 border-t border-gray-100">
          <CommentForm
            postId={post.id}
            isAdmin={isAdmin}
            authorEmail={adminEmail}
            authorName={isAdmin ? 'Admin' : undefined}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      </div>

      {/* Right Column — Sidebar */}
      <div className="w-full lg:w-[320px] flex-shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100 overflow-y-auto">
        <div className="space-y-5">
          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Status</label>
            {isAdmin && statuses.length > 0 ? (
              <Select value={currentStatus} onValueChange={handleStatusChange} disabled={updatingStatus}>
                <SelectTrigger className="w-full h-9 text-sm border-gray-200">
                  <SelectValue>
                    {getCurrentStatusDisplay()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.key} value={status.key}>
                      <span className="flex items-center gap-2">
                        <Circle className="h-3.5 w-3.5" style={{ color: status.color, fill: status.color }} />
                        {status.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                {currentStatusObj && (
                  <Circle className="h-3 w-3" style={{ color: currentStatusObj.color, fill: currentStatusObj.color }} />
                )}
                <span className="text-sm text-gray-700">
                  {currentStatusObj?.name || post.status}
                </span>
              </div>
            )}
          </div>

          {/* Votes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Votes</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                <ChevronUp className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-bold text-gray-900">{post.vote_count}</span>
              </div>
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Author</label>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {post.is_guest ? (post.guest_name || 'Guest') : (post.author_name || 'Anonymous')}
                </p>
                <p className="text-xs text-gray-400">
                  {post.is_guest ? post.guest_email : post.author_email}
                </p>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Created</label>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {formatDate(post.created_at)}
            </div>
          </div>

          {/* Tags (Admin) */}
          {isAdmin && orgId && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                Tags
              </label>
              <TagSelector postId={post.id} orgId={orgId} />
            </div>
          )}

          {/* Actions (Admin) */}
          {isAdmin && (
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Actions</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMergeOpen(true)}
                className="w-full justify-start gap-2 h-9 text-sm border-gray-200 hover:bg-gray-50"
              >
                <GitMerge className="h-3.5 w-3.5" />
                Merge Duplicate
              </Button>
              {post.linear_issue_url && (
                <a href={post.linear_issue_url} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 h-9 text-sm border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View in Linear
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

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
    </div>
  )
}

export function PostDetailDialog({
  post,
  isAdmin,
  adminEmail,
  children,
}: PostDetailDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[85vh] overflow-hidden p-8">
        {open && (
          <PostDetailContent
            post={post}
            isAdmin={isAdmin}
            adminEmail={adminEmail}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
