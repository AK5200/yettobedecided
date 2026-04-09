'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Plus,
  Trash2,
  Map,
  ListChecks,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { PostDetailDialog } from '@/components/boards/post-detail-dialog'
import { toast } from 'sonner'
import type { Post } from '@/lib/types/database'

interface RoadmapPost extends Post {
  board_name?: string
}

interface RoadmapViewProps {
  posts: RoadmapPost[]
  isAdmin?: boolean
  adminEmail?: string
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

const COLOR_OPTIONS = [
  { name: 'Gray', value: '#6B7280' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Teal', value: '#14B8A6' },
]

// Helper to get background color class from hex color
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

export function RoadmapView({ posts: initialPosts, isAdmin, adminEmail }: RoadmapViewProps) {
  const router = useRouter()

  const [posts, setPosts] = useState<RoadmapPost[]>(initialPosts)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  // Status management state
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loadingStatuses, setLoadingStatuses] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  const [newStatus, setNewStatus] = useState({
    name: '',
    color: '#6B7280',
    show_on_roadmap: true,
  })
  // Delete/reassign dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusToDelete, setStatusToDelete] = useState<Status | null>(null)
  const [reassignTarget, setReassignTarget] = useState<string>('')
  const [postCount, setPostCount] = useState(0)
  const [deleting, setDeleting] = useState(false)
  // View mode toggle (admin sees all, public sees only show_on_roadmap)
  const [viewMode, setViewMode] = useState<'admin' | 'public'>('admin')

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    try {
      const res = await fetch('/api/statuses')
      const data = await res.json()
      if (data.statuses) {
        setStatuses(data.statuses)
      }
    } catch (error) {
      console.error('Failed to fetch statuses:', error)
      toast.error('Failed to load statuses')
    } finally {
      setLoadingStatuses(false)
    }
  }

  const handleCreateStatus = async () => {
    if (!newStatus.name.trim()) return
    setSaving(true)

    try {
      const res = await fetch('/api/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create status')
      } else {
        toast.success('Status created!')
        setNewStatus({ name: '', color: '#6B7280', show_on_roadmap: true })
        setIsCreateDialogOpen(false)
        fetchStatuses()
      }
    } catch (error) {
      toast.error('Failed to create status')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (status: Status) => {
    setSaving(true)

    try {
      const res = await fetch(`/api/statuses/${status.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: status.name,
          color: status.color,
          show_on_roadmap: status.show_on_roadmap,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to update status')
      } else {
        toast.success('Status updated!')
        fetchStatuses()
      }
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setSaving(false)
      setEditingStatus(null)
    }
  }

  const handleDeleteStatus = async (status: Status) => {
    // First, try to delete without reassignment to check if posts exist
    try {
      const res = await fetch(`/api/statuses/${status.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.requiresReassignment) {
        // Posts need to be reassigned - show dialog
        setStatusToDelete(status)
        setPostCount(data.postCount)
        // Default to first available status that's not the one being deleted
        const defaultTarget = statuses.find(s => s.key !== status.key)
        setReassignTarget(defaultTarget?.key || '')
        setDeleteDialogOpen(true)
      } else if (!res.ok) {
        toast.error(data.error || 'Failed to delete status')
      } else {
        toast.success('Status deleted!')
        fetchStatuses()
      }
    } catch (error) {
      toast.error('Failed to delete status')
    }
  }

  const handleConfirmDelete = async () => {
    if (!statusToDelete || !reassignTarget) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/statuses/${statusToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reassignTo: reassignTarget }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete status')
      } else {
        const targetStatus = statuses.find(s => s.key === reassignTarget)
        toast.success(`Status deleted! ${data.reassignedCount} posts moved to "${targetStatus?.name}"`)
        setDeleteDialogOpen(false)
        setStatusToDelete(null)
        setReassignTarget('')
        fetchStatuses()
      }
    } catch (error) {
      toast.error('Failed to delete status')
    } finally {
      setDeleting(false)
    }
  }

  const handleReorder = async (statusId: string, direction: 'up' | 'down') => {
    const currentIndex = statuses.findIndex(s => s.id === statusId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= statuses.length) return

    // Create new ordered array
    const newStatuses = [...statuses]
    const [movedStatus] = newStatuses.splice(currentIndex, 1)
    newStatuses.splice(newIndex, 0, movedStatus)

    // Optimistically update UI
    setStatuses(newStatuses)

    try {
      const res = await fetch('/api/statuses/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderedIds: newStatuses.map(s => s.id),
        }),
      })

      if (!res.ok) {
        // Revert on error
        fetchStatuses()
        toast.error('Failed to reorder statuses')
      }
    } catch (error) {
      fetchStatuses()
      toast.error('Failed to reorder statuses')
    }
  }

  const getPostsForStatus = (statusKey: string) => {
    return posts.filter((post) => post.status === statusKey)
  }

  // Get statuses based on view mode
  // Admin view: all statuses, Public view: only show_on_roadmap statuses
  const displayStatuses = viewMode === 'public'
    ? statuses.filter(s => s.show_on_roadmap)
    : statuses

  const getAuthorName = (post: RoadmapPost) => {
    if (post.is_guest) {
      return post.guest_name || 'Guest'
    }
    return post.author_name || 'Anonymous'
  }

  const totalVisible = posts.length

  return (
    <div className="flex-1 bg-gradient-to-b from-muted/40 via-background to-background">
      {/* Header */}
      <div className="border-b bg-background/60 backdrop-blur">
        <div className="px-8 py-6 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground mb-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Roadmap
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              What we&apos;re building
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Drag cards across columns to update status. {totalVisible} total items.
            </p>
          </div>
          {isAdmin && (
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
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b">
        <Tabs defaultValue="roadmap">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger
              value="roadmap"
              className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground"
            >
              <span className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Roadmap
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="statuses"
              className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground"
            >
              <span className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Statuses
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Roadmap Tab */}
          <TabsContent value="roadmap" className="mt-0">
            <div className="p-6">
              {/* View mode indicator */}
              {viewMode === 'public' && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Viewing as public - only showing statuses marked for public roadmap
                </div>
              )}
              {loadingStatuses ? (
                <div className="text-muted-foreground">Loading roadmap...</div>
              ) : displayStatuses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {viewMode === 'public'
                      ? 'No statuses are set to show on the public roadmap.'
                      : 'No statuses found.'}
                  </p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Go to the Statuses tab to configure which statuses appear here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Search bar */}
                  <div className="mb-5 flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search roadmap…"
                        className="h-10 w-72 rounded-xl border border-border bg-background/80 backdrop-blur pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300 transition"
                      />
                    </div>
                  </div>

                  <div
                    className="grid gap-5"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(displayStatuses.length, 5)}, minmax(0, 1fr))`,
                    }}
                  >
                    {displayStatuses.map((status) => {
                      const q = query.trim().toLowerCase()
                      const columnPosts = getPostsForStatus(status.key).filter((p) =>
                        !q
                          ? true
                          : p.title.toLowerCase().includes(q) ||
                            (p.content || '').toLowerCase().includes(q)
                      )
                      return (
                        <section
                          key={status.id}
                          className="flex flex-col rounded-2xl border border-border bg-background/60 backdrop-blur-sm shadow-sm"
                        >
                          {/* Column Header */}
                          <div
                            className="rounded-t-2xl px-4 py-3 border-b border-border/70"
                            style={{
                              background: `linear-gradient(180deg, ${status.color}14 0%, ${status.color}06 100%)`,
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: status.color }}
                              />
                              <h2 className="text-[13px] font-semibold text-foreground tracking-tight uppercase">
                                {status.name}
                              </h2>
                              <span
                                className="ml-auto text-[11px] font-bold rounded-full px-2 py-0.5"
                                style={{
                                  backgroundColor: status.color + '20',
                                  color: status.color,
                                }}
                              >
                                {columnPosts.length}
                              </span>
                            </div>
                          </div>

                          {/* Posts */}
                          <div className="p-3 space-y-2.5 flex-1 min-h-[420px] rounded-b-2xl">
                            {columnPosts.length === 0 ? (
                              <div className="h-full min-h-[380px] flex items-center justify-center rounded-xl border border-dashed border-border/70">
                                <p className="text-xs text-muted-foreground/60">
                                  No items
                                </p>
                              </div>
                            ) : (
                              columnPosts.map((post) => {
                                const initials =
                                  (getAuthorName(post)
                                    .split(/\s+/)
                                    .map((w) => w[0])
                                    .join('')
                                    .slice(0, 2) || '?').toUpperCase()
                                return (
                                  <div
                                    key={post.id}
                                    className="group relative bg-card rounded-xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-amber-300/70 transition-all"
                                  >
                                    <span
                                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                                      style={{ backgroundColor: status.color }}
                                    />

                                    <PostDetailDialog
                                      post={post}
                                      isAdmin={isAdmin}
                                      adminEmail={adminEmail}
                                    >
                                      <div className="p-4 pl-5 cursor-pointer">
                                        <h4 className="text-[13px] font-semibold text-foreground mb-1.5 pr-6 leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors">
                                          {post.title}
                                        </h4>
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
                                                background: `linear-gradient(135deg, ${status.color}, ${status.color}cc)`,
                                              }}
                                              title={getAuthorName(post)}
                                            >
                                              {initials}
                                            </div>
                                            {post.board_name && (
                                              <Badge
                                                variant="outline"
                                                className="text-[10px] px-1.5 py-0 h-5"
                                              >
                                                {post.board_name}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10.5px] font-bold text-foreground/80">
                                              <ChevronUp className="h-3 w-3" />
                                              {post.vote_count || 0}
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
                </>
              )}
            </div>
          </TabsContent>

          {/* Statuses Tab */}
          <TabsContent value="statuses" className="mt-0">
            <div className="p-6 max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Manage Statuses</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customize the statuses for your feedback posts
                  </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-foreground hover:bg-foreground/90 text-background">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create New Status</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="statusName">Status Name</Label>
                        <Input
                          id="statusName"
                          placeholder="e.g., Under Review"
                          value={newStatus.name}
                          onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_OPTIONS.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setNewStatus({ ...newStatus, color: color.value })}
                              className={`w-8 h-8 rounded-full transition-all ${
                                newStatus.color === color.value
                                  ? 'ring-2 ring-offset-2 ring-gray-400'
                                  : 'hover:scale-110'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showOnRoadmap"
                          checked={newStatus.show_on_roadmap}
                          onChange={(e) =>
                            setNewStatus({ ...newStatus, show_on_roadmap: e.target.checked })
                          }
                          className="rounded border-border"
                        />
                        <Label htmlFor="showOnRoadmap" className="text-sm font-normal">
                          Show on public roadmap
                        </Label>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateStatus} disabled={saving || !newStatus.name.trim()}>
                          {saving ? 'Creating...' : 'Create Status'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Statuses List */}
              {loadingStatuses ? (
                <div className="text-muted-foreground">Loading statuses...</div>
              ) : (
                <div className="space-y-2">
                  {statuses.map((status, index) => (
                    <Card key={status.id} className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Reorder Arrows */}
                        <div className="flex flex-col gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => handleReorder(status.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className={`h-3 w-3 ${index === 0 ? 'text-muted-foreground/30' : 'text-muted-foreground/60'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => handleReorder(status.id, 'down')}
                            disabled={index === statuses.length - 1}
                          >
                            <ArrowDown className={`h-3 w-3 ${index === statuses.length - 1 ? 'text-muted-foreground/30' : 'text-muted-foreground/60'}`} />
                          </Button>
                        </div>

                        <Circle
                          className="h-4 w-4 shrink-0"
                          style={{ color: status.color, fill: status.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{status.name}</span>
                            <span className="text-xs text-muted-foreground/60 font-mono">{status.key}</span>
                            {status.show_on_roadmap && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                                Roadmap
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingStatus(status)}
                          >
                            Edit
                          </Button>
                          {statuses.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStatus(status)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Edit Status Dialog */}
              <Dialog open={!!editingStatus} onOpenChange={() => setEditingStatus(null)}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit Status</DialogTitle>
                  </DialogHeader>
                  {editingStatus && (
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="editStatusName">Status Name</Label>
                        <Input
                          id="editStatusName"
                          value={editingStatus.name}
                          onChange={(e) =>
                            setEditingStatus({ ...editingStatus, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Key</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingStatus.key}
                            disabled
                            className="font-mono text-sm bg-muted/50"
                          />
                          <span className="text-xs text-muted-foreground/60">(cannot be changed)</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_OPTIONS.map((color) => (
                            <button
                              key={color.value}
                              onClick={() =>
                                setEditingStatus({ ...editingStatus, color: color.value })
                              }
                              className={`w-8 h-8 rounded-full transition-all ${
                                editingStatus.color === color.value
                                  ? 'ring-2 ring-offset-2 ring-gray-400'
                                  : 'hover:scale-110'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="editShowOnRoadmap"
                          checked={editingStatus.show_on_roadmap}
                          onChange={(e) =>
                            setEditingStatus({ ...editingStatus, show_on_roadmap: e.target.checked })
                          }
                          className="rounded border-border"
                        />
                        <Label htmlFor="editShowOnRoadmap" className="text-sm font-normal">
                          Show on public roadmap
                        </Label>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setEditingStatus(null)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleUpdateStatus(editingStatus)}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Delete/Reassign Dialog */}
              <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  setDeleteDialogOpen(false)
                  setStatusToDelete(null)
                  setReassignTarget('')
                }
              }}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Reassign Posts Before Deleting
                    </DialogTitle>
                  </DialogHeader>
                  {statusToDelete && (
                    <div className="space-y-4 pt-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-800">
                          <strong>{postCount} post{postCount !== 1 ? 's' : ''}</strong> currently use the
                          <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-background rounded border">
                            <Circle className="h-3 w-3" style={{ color: statusToDelete.color, fill: statusToDelete.color }} />
                            {statusToDelete.name}
                          </span>
                          status. Select a new status to move them to:
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Move posts to:</Label>
                        <Select value={reassignTarget} onValueChange={setReassignTarget}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses
                              .filter(s => s.key !== statusToDelete.key)
                              .map((s) => (
                                <SelectItem key={s.key} value={s.key}>
                                  <span className="flex items-center gap-2">
                                    <Circle className="h-3 w-3" style={{ color: s.color, fill: s.color }} />
                                    {s.name}
                                  </span>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDeleteDialogOpen(false)
                            setStatusToDelete(null)
                            setReassignTarget('')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleConfirmDelete}
                          disabled={deleting || !reassignTarget}
                        >
                          {deleting ? 'Deleting...' : `Delete & Move ${postCount} Post${postCount !== 1 ? 's' : ''}`}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
