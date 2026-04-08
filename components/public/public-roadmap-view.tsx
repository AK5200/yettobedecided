'use client'

import { useMemo, useState } from 'react'
import { PostDetailDialog } from '@/components/boards/post-detail-dialog'
import { PublicHubNav } from '@/components/public/public-hub-nav'
import {
  ChevronUp,
  MessageSquare,
  Map,
  Search,
  GripVertical,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Post, Organization } from '@/lib/types/database'

interface RoadmapColumn {
  key: string
  label: string
  color: string
  dotColor: string
  posts: Post[]
}

interface PublicRoadmapViewProps {
  org: Organization
  orgSlug: string
  columns: RoadmapColumn[]
  commentCountMap: Record<string, number>
}

// Map roadmap column key -> DB status value (matches page.tsx mapping)
const COLUMN_KEY_TO_STATUS: Record<string, Post['status']> = {
  planned: 'planned',
  in_progress: 'in_progress',
  next: 'open',
  completed: 'shipped',
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

function authorOf(post: Post & { is_guest?: boolean; guest_name?: string | null; author_name?: string | null }) {
  if (post.is_guest) return post.guest_name || 'Guest'
  return post.author_name || 'Anonymous'
}

export function PublicRoadmapView({
  org,
  orgSlug,
  columns: initialColumns,
  commentCountMap,
}: PublicRoadmapViewProps) {
  const [columns, setColumns] = useState<RoadmapColumn[]>(initialColumns)
  const [query, setQuery] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  const totalPosts = useMemo(
    () => columns.reduce((sum, col) => sum + col.posts.length, 0),
    [columns]
  )

  const filteredColumns = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return columns
    return columns.map((c) => ({
      ...c,
      posts: c.posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.content || '').toLowerCase().includes(q)
      ),
    }))
  }, [columns, query])

  const movePost = async (postId: string, fromKey: string, toKey: string) => {
    if (fromKey === toKey) return

    // Snapshot for revert
    const snapshot = columns

    // Optimistic update
    let moved: Post | undefined
    const next = columns.map((c) => {
      if (c.key === fromKey) {
        const idx = c.posts.findIndex((p) => p.id === postId)
        if (idx >= 0) {
          moved = c.posts[idx]
          return { ...c, posts: c.posts.filter((p) => p.id !== postId) }
        }
      }
      return c
    })
    if (!moved) return
    const newStatus = COLUMN_KEY_TO_STATUS[toKey]
    const movedWithStatus = { ...moved, status: newStatus } as Post
    const next2 = next.map((c) =>
      c.key === toKey ? { ...c, posts: [movedWithStatus, ...c.posts] } : c
    )
    setColumns(next2)

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        setColumns(snapshot)
        if (res.status === 401) {
          toast.error('Sign in as an admin to move items')
        } else {
          const data = await res.json().catch(() => ({}))
          toast.error(data.error || 'Failed to move item')
        }
      } else {
        toast.success('Status updated')
      }
    } catch {
      setColumns(snapshot)
      toast.error('Failed to move item')
    }
  }

  const onDragStart = (e: React.DragEvent, postId: string, fromKey: string) => {
    setDraggingId(postId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ postId, fromKey }))
  }

  const onDragEnd = () => {
    setDraggingId(null)
    setDragOverCol(null)
  }

  const onColumnDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCol !== key) setDragOverCol(key)
  }

  const onColumnDrop = (e: React.DragEvent, toKey: string) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('text/plain')
    setDragOverCol(null)
    setDraggingId(null)
    if (!raw) return
    try {
      const { postId, fromKey } = JSON.parse(raw)
      movePost(postId, fromKey, toKey)
    } catch {
      /* noop */
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background">
      <PublicHubNav org={org} orgSlug={orgSlug} />

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-muted-foreground mb-3">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Public Roadmap
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              What we&apos;re building
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Track every idea from review to launch. Drag cards across columns
              to update status (admins only).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roadmap…"
                className="h-10 w-64 rounded-xl border border-border bg-background/80 backdrop-blur pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300 transition"
              />
            </div>
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-background/80 backdrop-blur px-3 h-10 text-xs font-medium text-muted-foreground">
              <span className="text-foreground font-semibold">{totalPosts}</span>
              total items
            </div>
          </div>
        </div>

        {totalPosts === 0 ? (
          <div className="text-center py-24 rounded-3xl border border-dashed border-border bg-background/60">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Map className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-base font-semibold text-foreground">Roadmap is empty</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back soon for updates
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {filteredColumns.map((column) => {
              const isOver = dragOverCol === column.key
              return (
                <section
                  key={column.key}
                  onDragOver={(e) => onColumnDragOver(e, column.key)}
                  onDragLeave={() =>
                    dragOverCol === column.key && setDragOverCol(null)
                  }
                  onDrop={(e) => onColumnDrop(e, column.key)}
                  className={`flex flex-col rounded-2xl border bg-background/60 backdrop-blur-sm shadow-sm transition-all ${
                    isOver
                      ? 'border-amber-300 ring-2 ring-amber-200/60 shadow-lg'
                      : 'border-border'
                  }`}
                >
                  {/* Column header (sticky-like) */}
                  <div
                    className="rounded-t-2xl px-4 py-3 border-b border-border/70"
                    style={{
                      background: `linear-gradient(180deg, ${column.dotColor}14 0%, ${column.dotColor}06 100%)`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: column.dotColor }}
                      />
                      <h2 className="text-[13px] font-semibold text-foreground tracking-tight uppercase">
                        {column.label}
                      </h2>
                      <span
                        className="ml-auto text-[11px] font-bold rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor: column.dotColor + '20',
                          color: column.dotColor,
                        }}
                      >
                        {column.posts.length}
                      </span>
                    </div>
                  </div>

                  {/* Column content */}
                  <div
                    className={`p-3 space-y-2.5 flex-1 min-h-[420px] rounded-b-2xl transition-colors ${
                      isOver ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {column.posts.length === 0 ? (
                      <div className="h-full min-h-[380px] flex items-center justify-center rounded-xl border border-dashed border-border/70">
                        <p className="text-xs text-muted-foreground/60">
                          {isOver ? 'Drop here' : 'No items'}
                        </p>
                      </div>
                    ) : (
                      column.posts.map((post) => {
                        const isDragging = draggingId === post.id
                        const author = authorOf(post as any)
                        return (
                          <div
                            key={post.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, post.id, column.key)}
                            onDragEnd={onDragEnd}
                            className={`group relative bg-card rounded-xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-amber-300/70 transition-all ${
                              isDragging ? 'opacity-40 rotate-1 scale-[0.98]' : ''
                            }`}
                          >
                            {/* Left status accent bar */}
                            <span
                              className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                              style={{ backgroundColor: column.dotColor }}
                            />

                            {/* Drag handle */}
                            <div
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground/50"
                              title="Drag to move"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>

                            <PostDetailDialog post={post}>
                              <div className="p-4 pl-5 cursor-pointer">
                                <h3 className="text-[13px] font-semibold text-foreground mb-1.5 pr-6 leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors">
                                  {post.title}
                                </h3>

                                {post.content && (
                                  <p className="text-[11.5px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                                    {post.content}
                                  </p>
                                )}

                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-background"
                                      style={{
                                        background: `linear-gradient(135deg, ${column.dotColor}, ${column.dotColor}cc)`,
                                      }}
                                      title={author}
                                    >
                                      {getInitials(author)}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10.5px] font-bold text-foreground/80">
                                      <ChevronUp className="h-3 w-3" />
                                      {post.vote_count ?? 0}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10.5px] font-bold text-foreground/80">
                                      <MessageSquare className="h-3 w-3" />
                                      {commentCountMap[post.id] || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </PostDetailDialog>
                          </div>
                        )
                      })
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Branding footer */}
        {org.show_branding && (
          <div className="mt-16 pb-8 text-center">
            <span className="text-xs text-muted-foreground/60">
              Powered by{' '}
              <a
                href="https://kelohq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-muted-foreground hover:text-foreground/80 transition-colors"
              >
                Kelo
              </a>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
