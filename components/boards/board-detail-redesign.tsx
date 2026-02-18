'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { Post } from '@/lib/types/database'
import type { Status } from './post-card-redesign'
import {
  Plus,
  Search,
  Settings,
  LayoutList,
  LayoutGrid,
  Filter,
  ArrowUpDown,
  ChevronDown,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { BoardPostsListRedesign } from './board-posts-list-redesign'
import { KanbanBoardRedesign } from './kanban-board-redesign'

interface BoardDetailRedesignProps {
  boardId: string
  boardName: string
  boardDescription: string | null
  orgId: string
  pendingPosts: Post[]
  approvedPosts: Post[]
  allPosts: Post[]
  adminEmail: string
}

export function BoardDetailRedesign({
  boardId,
  boardName,
  boardDescription,
  orgId,
  pendingPosts,
  approvedPosts,
  allPosts,
  adminEmail,
}: BoardDetailRedesignProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(
    (searchParams.get('view') as 'list' | 'kanban') || 'list'
  )
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')
  const [statuses, setStatuses] = useState<Status[]>([])

  // Fetch statuses ONCE at the top level
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

  const updateURL = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    router.push(`${pathname}?${newParams.toString()}`)
  }

  const handleViewChange = (view: 'list' | 'kanban') => {
    setViewMode(view)
    updateURL({ view })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    updateURL({ q: value })
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    updateURL({ status: value })
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    updateURL({ sort: value })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setSortBy('newest')
    router.push(pathname)
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || sortBy !== 'newest'

  // Stats
  const stats = useMemo(() => {
    return {
      total: allPosts.length,
      pending: pendingPosts.length,
      approved: approvedPosts.length,
      totalVotes: allPosts.reduce((sum, post) => sum + (post.vote_count || 0), 0),
    }
  }, [allPosts, pendingPosts, approvedPosts])

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-8 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Link href="/boards" className="hover:text-gray-700 transition-colors">
              Boards
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{boardName}</span>
          </div>

          {/* Header Content */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {boardName}
                </h1>
                <div className="flex items-center gap-2">
                  <Badge className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-100">
                    {stats.total} posts
                  </Badge>
                  {stats.pending > 0 && (
                    <Badge className="px-2 py-0.5 text-xs font-semibold border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50">
                      {stats.pending} pending
                    </Badge>
                  )}
                </div>
              </div>
              {boardDescription && (
                <p className="text-gray-500 text-sm max-w-2xl">
                  {boardDescription}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/boards/${boardId}/new-post`}>
                <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                  <Plus className="h-4 w-4" />
                  New Post
                </Button>
              </Link>
              <Link href={`/boards/${boardId}/settings`}>
                <Button variant="outline" size="icon" className="border-gray-200 hover:bg-gray-50">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters & View Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-8 bg-white border-gray-200 focus:border-amber-400 focus:ring-amber-200/50 h-9 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-2 h-9 shadow-sm ${statusFilter !== 'all' ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Status
                  {statusFilter !== 'all' && (
                    <span className="ml-1 px-1.5 py-0 text-[10px] font-bold rounded-full bg-amber-500 text-white">1</span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusChange('all')}>
                  <div className="flex items-center justify-between w-full">
                    <span>All</span>
                    {statusFilter === 'all' && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('open')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Open</span>
                    {statusFilter === 'open' && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                  <div className="flex items-center justify-between w-full">
                    <span>In Progress</span>
                    {statusFilter === 'in_progress' && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('planned')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Planned</span>
                    {statusFilter === 'planned' && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Completed</span>
                    {statusFilter === 'completed' && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 border-gray-200 shadow-sm hover:bg-gray-50">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSortChange('newest')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Newest first</span>
                    {sortBy === 'newest' && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('oldest')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Oldest first</span>
                    {sortBy === 'oldest' && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('most_votes')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Most votes</span>
                    {sortBy === 'most_votes' && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 h-9 text-gray-500 hover:bg-gray-50">
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}

            {/* View Toggle */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white ml-auto shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewChange('list')}
                className={`gap-2 h-7 px-3 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 hover:bg-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                List
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewChange('kanban')}
                className={`gap-2 h-7 px-3 ${viewMode === 'kanban' ? 'bg-gray-100 text-gray-900 hover:bg-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Kanban
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {viewMode === 'list' ? (
          <BoardPostsListRedesign
            boardId={boardId}
            orgId={orgId}
            pendingPosts={pendingPosts}
            approvedPosts={approvedPosts}
            adminEmail={adminEmail}
            statuses={statuses}
          />
        ) : (
          <KanbanBoardRedesign
            posts={allPosts}
            isAdmin={true}
            adminEmail={adminEmail}
            boardId={boardId}
            statuses={statuses}
          />
        )}
      </div>
    </div>
  )
}
