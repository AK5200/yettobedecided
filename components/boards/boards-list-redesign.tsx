'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Board } from '@/lib/types/database'
import {
  Plus,
  Search,
  Archive,
  MessageSquare,
  TrendingUp,
  Calendar,
  MoreVertical,
  ArrowUpRight,
  Sparkles,
  LayoutGrid,
  LayoutList
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface BoardWithStats extends Board {
  total_posts?: number
  total_votes?: number
}

interface BoardsListRedesignProps {
  activeBoards: BoardWithStats[]
  archivedBoards: BoardWithStats[]
}

export function BoardsListRedesign({ activeBoards, archivedBoards }: BoardsListRedesignProps) {
  const router = useRouter()
  const [loadingBoardId, setLoadingBoardId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleUnarchive = async (boardId: string) => {
    setLoadingBoardId(boardId)
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: false }),
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          toast.error(errorData.error || 'Failed to unarchive board.')
        } else {
          toast.error('Failed to unarchive board.')
        }
        return
      }

      toast.success('Board unarchived.')
      router.refresh()
    } catch (error) {
      toast.error('Failed to unarchive board.')
    } finally {
      setLoadingBoardId(null)
    }
  }

  const handleArchive = async (boardId: string) => {
    setLoadingBoardId(boardId)
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: true }),
      })

      if (!response.ok) {
        toast.error('Failed to archive board.')
        return
      }

      toast.success('Board archived.')
      router.refresh()
    } catch (error) {
      toast.error('Failed to archive board.')
    } finally {
      setLoadingBoardId(null)
    }
  }

  const displayBoards = showArchived ? archivedBoards : activeBoards
  const filteredBoards = displayBoards.filter(board =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    board.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPosts = activeBoards.reduce((acc, board) => acc + (board.total_posts || 0), 0)
  const totalVotes = activeBoards.reduce((acc, board) => acc + (board.total_votes || 0), 0)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Feedback Boards
                </h1>
                <Badge className="px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50">
                  {activeBoards.length} Active
                </Badge>
              </div>
              <p className="text-gray-500 text-sm">
                Organize and prioritize feedback from your customers
              </p>
            </div>
            <Link href="/boards/new">
              <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                <Plus className="h-4 w-4" />
                New Board
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <div className="p-1.5 rounded-lg bg-amber-50">
                  <LayoutGrid className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide">Boards</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{activeBoards.length}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <div className="p-1.5 rounded-lg bg-blue-50">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide">Feedback</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalPosts}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <div className="p-1.5 rounded-lg bg-green-50">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide">Votes</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalVotes}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Filters Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-amber-400 focus:ring-amber-200/50 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived(false)}
              className={`gap-2 ${!showArchived ? 'bg-amber-500 text-white hover:bg-amber-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Active
              <span className={`ml-0.5 text-[10px] font-bold px-1.5 py-0 rounded-full ${!showArchived ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {activeBoards.length}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived(true)}
              className={`gap-2 ${showArchived ? 'bg-amber-500 text-white hover:bg-amber-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Archive className="h-3.5 w-3.5" />
              Archived
              <span className={`ml-0.5 text-[10px] font-bold px-1.5 py-0 rounded-full ${showArchived ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {archivedBoards.length}
              </span>
            </Button>
          </div>

          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900 hover:bg-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 hover:bg-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Boards Grid/List */}
        {filteredBoards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No boards found' : showArchived ? 'No archived boards' : 'No boards yet'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : showArchived
                ? 'Archived boards will appear here'
                : 'Create your first board to start collecting feedback'
              }
            </p>
            {!searchQuery && !showArchived && (
              <Link href="/boards/new">
                <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                  <Plus className="h-4 w-4" />
                  Create Board
                </Button>
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBoards.map((board) => (
              <Card
                key={board.id}
                className="group relative overflow-hidden border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 bg-white"
              >
                <Link href={`/boards/${board.id}`}>
                  <div className="p-6">
                    {/* Accent bar on hover */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
                          {board.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                          {board.description || 'No description'}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-800">{board.total_posts || 0}</span>
                        <span className="text-xs text-gray-400">posts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-800">{board.total_votes || 0}</span>
                        <span className="text-xs text-gray-400">votes</span>
                      </div>
                    </div>

                    {board.created_at && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(board.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Quick Actions */}
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/boards/${board.id}/settings`)}>
                        Settings
                      </DropdownMenuItem>
                      {showArchived ? (
                        <DropdownMenuItem
                          onClick={() => handleUnarchive(board.id)}
                          disabled={loadingBoardId === board.id}
                        >
                          {loadingBoardId === board.id ? 'Unarchiving...' : 'Unarchive'}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleArchive(board.id)}
                          disabled={loadingBoardId === board.id}
                          className="text-red-600"
                        >
                          Archive
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBoards.map((board) => (
              <Card
                key={board.id}
                className="group relative overflow-hidden border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white"
              >
                <Link href={`/boards/${board.id}`}>
                  <div className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-base text-gray-900 group-hover:text-amber-600 transition-colors">
                          {board.name}
                        </h3>
                        <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {board.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-800">{board.total_posts || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-800">{board.total_votes || 0}</span>
                      </div>
                      {board.created_at && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-[100px]">
                          <Calendar className="h-3 w-3" />
                          {new Date(board.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/boards/${board.id}/settings`)}>
                          Settings
                        </DropdownMenuItem>
                        {showArchived ? (
                          <DropdownMenuItem
                            onClick={() => handleUnarchive(board.id)}
                            disabled={loadingBoardId === board.id}
                          >
                            {loadingBoardId === board.id ? 'Unarchiving...' : 'Unarchive'}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleArchive(board.id)}
                            disabled={loadingBoardId === board.id}
                            className="text-red-600"
                          >
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
