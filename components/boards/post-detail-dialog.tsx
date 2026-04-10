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
  guestCommentingEnabled?: boolean
  orgSlug?: string
  loginHandler?: string | null
  ssoRedirectUrl?: string | null
  orgName?: string
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

function PostDetailContent({
  post,
  isAdmin,
  adminEmail,
  guestCommentingEnabled,
  orgSlug,
  loginHandler,
  ssoRedirectUrl,
  orgName,
}: {
  post: Post
  isAdmin?: boolean
  adminEmail?: string
  guestCommentingEnabled?: boolean
  orgSlug?: string
  loginHandler?: string | null
  ssoRedirectUrl?: string | null
  orgName?: string
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
      if (board?.org_id) setOrgId(board.org_id)
    }
    fetchOrgId()
  }, [post.board_id])

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await fetch('/api/statuses')
        const data = await res.json()
        if (data.statuses) setStatuses(data.statuses)
      } catch (error) {
        console.error('Failed to fetch statuses:', error)
      }
    }
    fetchStatuses()
  }, [])

  const handleCommentAdded = () => setRefreshTrigger((prev) => prev + 1)

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
        const statusObj = statuses.find((s) => s.key === newStatus)
        toast.success(`Status updated to ${statusObj?.name || newStatus}`)
        router.refresh()
      } else {
        toast.error('Failed to update status')
      }
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const currentStatusObj = statuses.find((s) => s.key === currentStatus)

  return (
    <div
      className="flex flex-col lg:flex-row gap-0 lg:gap-0 min-h-0"
      style={{ height: 'calc(85vh - 80px)' }}
    >
      {/* Left — Content + Comments */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <DialogHeader className="mb-5 shrink-0 pr-6">
          <DialogTitle className="text-xl font-bold text-foreground leading-tight tracking-tight">
            {post.title}
          </DialogTitle>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {post.is_guest ? post.guest_name || 'Guest' : post.author_name || 'Anonymous'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground/60" suppressHydrationWarning>{formatDate(post.created_at)}</span>
          </div>
        </DialogHeader>

        {/* Scrollable area */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-6 lg:pr-8">
          {post.content && (
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-6">
              {post.content}
            </div>
          )}

          {post.admin_note && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-700">
                <span className="font-semibold">Admin note:</span> {post.admin_note}
              </p>
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-border/50 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-muted-foreground/60" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Comments
              </h3>
            </div>
            <CommentList
              postId={post.id}
              isAdmin={isAdmin}
              refreshTrigger={refreshTrigger}
              userEmail={adminEmail}
            />
          </div>
        </div>

        {/* Fixed comment form */}
        <div className="shrink-0 pt-4 pr-6 lg:pr-8 border-t border-border/50">
          <CommentForm
            postId={post.id}
            isAdmin={isAdmin}
            authorEmail={adminEmail}
            authorName={isAdmin ? 'Admin' : undefined}
            onCommentAdded={handleCommentAdded}
            guestCommentingEnabled={guestCommentingEnabled}
            orgSlug={orgSlug}
            loginHandler={loginHandler}
            ssoRedirectUrl={ssoRedirectUrl}
            orgName={orgName}
          />
        </div>
      </div>

      {/* Right — Sidebar */}
      <div className="w-full lg:w-[280px] shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border/50 overflow-y-auto lg:pl-6">
        <div className="space-y-5">
          {/* Status */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 block">
              Status
            </label>
            {isAdmin && statuses.length > 0 ? (
              <Select
                value={currentStatus}
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-full h-9 text-sm border-border rounded-lg">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      {currentStatusObj && (
                        <Circle
                          className="h-3 w-3"
                          style={{ color: currentStatusObj.color, fill: currentStatusObj.color }}
                        />
                      )}
                      {currentStatusObj?.name || currentStatus}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.key} value={status.key}>
                      <span className="flex items-center gap-2">
                        <Circle
                          className="h-3 w-3"
                          style={{ color: status.color, fill: status.color }}
                        />
                        {status.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                {currentStatusObj && (
                  <Circle
                    className="h-3 w-3"
                    style={{ color: currentStatusObj.color, fill: currentStatusObj.color }}
                  />
                )}
                <span className="text-sm text-foreground/80">
                  {currentStatusObj?.name || post.status}
                </span>
              </div>
            )}
          </div>

          {/* Votes */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 block">
              Votes
            </label>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-base font-bold text-foreground">{post.vote_count}</span>
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 block">
              Author
            </label>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {post.is_guest ? post.guest_name || 'Guest' : post.author_name || 'Anonymous'}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {post.is_guest ? post.guest_email : post.author_email}
                </p>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 block">
              Created
            </label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground" suppressHydrationWarning>
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
              {formatDate(post.created_at)}
            </div>
          </div>

          {/* Tags (Admin) */}
          {isAdmin && orgId && (
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                Tags
              </label>
              <TagSelector postId={post.id} orgId={orgId} />
            </div>
          )}

          {/* Actions (Admin) */}
          {isAdmin && (
            <div className="pt-4 border-t border-border/50 space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 block">
                Actions
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMergeOpen(true)}
                className="w-full justify-start gap-2 h-9 text-sm border-border rounded-lg hover:bg-muted/50"
              >
                <GitMerge className="h-3.5 w-3.5" />
                Merge Duplicate
              </Button>
              {post.linear_issue_url && (
                <a href={post.linear_issue_url} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 h-9 text-sm border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg"
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
          sourcePost={{
            id: post.id,
            title: post.title,
            content: post.content || '',
            vote_count: post.vote_count || 0,
          }}
          boardId={post.board_id}
          onMerged={() => router.refresh()}
        />
      )}
    </div>
  )
}

export function PostDetailDialog({ post, isAdmin, adminEmail, children, guestCommentingEnabled, orgSlug, loginHandler, ssoRedirectUrl, orgName }: PostDetailDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] overflow-hidden p-6 lg:p-8 rounded-xl border-border">
        {open && (
          <PostDetailContent post={post} isAdmin={isAdmin} adminEmail={adminEmail} guestCommentingEnabled={guestCommentingEnabled} orgSlug={orgSlug} loginHandler={loginHandler} ssoRedirectUrl={ssoRedirectUrl} orgName={orgName} />
        )}
      </DialogContent>
    </Dialog>
  )
}
