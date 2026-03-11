'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PostDetailDialog } from '@/components/boards/post-detail-dialog'
import { GuestPostForm } from '@/components/posts/guest-post-form'
import { PublicHubNav } from '@/components/public/public-hub-nav'
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
  Search,
  ChevronUp,
  Plus,
  MessageSquare,
  Star,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Board, Post, ChangelogEntry, Organization } from '@/lib/types/database'

interface PublicFeaturesViewProps {
  org: Organization
  orgSlug: string
  boards: Board[]
  posts: (Post & { boards?: { id: string; name: string; slug: string } })[]
  tagsByPostId: Record<string, any[]>
  changelogEntries: ChangelogEntry[]
  currentBoard?: string
  currentStatus: string
  searchQuery: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  all: { label: 'All', color: 'text-gray-700', bg: 'bg-gray-100' },
  open: { label: 'Open', color: 'text-blue-700', bg: 'bg-blue-50' },
  planned: { label: 'Planned', color: 'text-violet-700', bg: 'bg-violet-50' },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-amber-50' },
  shipped: { label: 'Shipped', color: 'text-emerald-700', bg: 'bg-emerald-50' },
}

// Deterministic color for author names
const AUTHOR_COLORS = [
  'text-blue-600', 'text-violet-600', 'text-emerald-600', 'text-rose-600',
  'text-amber-600', 'text-cyan-600', 'text-indigo-600', 'text-teal-600',
  'text-pink-600', 'text-orange-600',
]

function getAuthorColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length]
}

// Board tag colors
const BOARD_COLORS = [
  { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { text: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  { text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
]

function getBoardColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return BOARD_COLORS[Math.abs(hash) % BOARD_COLORS.length]
}

export function PublicFeaturesView({
  org,
  orgSlug,
  boards,
  posts,
  tagsByPostId,
  changelogEntries,
  currentBoard,
  currentStatus,
  searchQuery: initialSearchQuery,
}: PublicFeaturesViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [sortBy, setSortBy] = useState<'latest' | 'most_votes'>('latest')
  const [voterEmail, setVoterEmail] = useState('')
  const [votedPostIds, setVotedPostIds] = useState<string[]>([])
  const [votingIds, setVotingIds] = useState<string[]>([])
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const [selectedBoardForPost, setSelectedBoardForPost] = useState<string>(
    currentBoard
      ? boards.find((b) => b.slug === currentBoard)?.id || boards[0]?.id || ''
      : boards[0]?.id || ''
  )

  const buildUrl = (overrides: { board?: string | null; status?: string; q?: string }) => {
    const params = new URLSearchParams()
    const board = overrides.board !== undefined ? overrides.board : currentBoard
    const status = overrides.status !== undefined ? overrides.status : currentStatus
    const q = overrides.q !== undefined ? overrides.q : searchQuery

    if (board) params.set('board', board)
    if (status && status !== 'all') params.set('status', status)
    if (q) params.set('q', q)
    const qs = params.toString()
    return `/${orgSlug}/features${qs ? `?${qs}` : ''}`
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = buildUrl({ q: searchQuery })
  }

  useEffect(() => {
    if (!voterEmail || boards.length === 0) {
      setVotedPostIds([])
      return
    }
    const fetchVoteStatuses = async () => {
      try {
        const votePromises = boards.map((board) =>
          fetch(
            `/api/votes/by-email?board_id=${board.id}&voter_email=${encodeURIComponent(voterEmail)}`
          )
            .then((res) => (res.ok ? res.json() : { post_ids: [] }))
            .then((data) => data.post_ids || [])
            .catch(() => [])
        )
        const allVotedIds = await Promise.all(votePromises)
        setVotedPostIds(Array.from(new Set(allVotedIds.flat())))
      } catch {
        // silently fail
      }
    }
    fetchVoteStatuses()
  }, [voterEmail, boards])

  const handleVote = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!voterEmail) {
      const email = window.prompt('Enter your email to vote:')
      if (!email) return
      setVoterEmail(email)
      setTimeout(() => handleVote(postId, e), 100)
      return
    }
    if (votingIds.includes(postId)) return
    setVotingIds((prev) => [...prev, postId])
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, voter_email: voterEmail }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData?.error || 'Unable to vote. Please try again.')
        return
      }
      toast.success('Vote updated!')
      router.refresh()
    } catch {
      toast.error('Failed to vote')
    } finally {
      setVotingIds((prev) => prev.filter((id) => id !== postId))
    }
  }

  const handlePostCreated = () => {
    setCreatePostOpen(false)
    router.refresh()
  }

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    if (sortBy === 'most_votes') return (b.vote_count || 0) - (a.vote_count || 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <PublicHubNav org={org} orgSlug={orgSlug} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Feature Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Browse, vote, and submit ideas</p>
          </div>
          <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 px-4 bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 rounded-lg text-sm font-semibold shadow-sm border border-yellow-400/50 cursor-pointer">
                <Plus className="h-4 w-4 mr-1.5" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg p-0 gap-0 rounded-xl overflow-hidden border-gray-200">
              <DialogHeader className="px-6 pt-6 pb-0">
                <DialogTitle className="text-lg font-semibold text-gray-900">Submit feedback</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">Share your idea or report an issue</p>
              </DialogHeader>
              {boards.length > 0 && (
                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Board</label>
                    <Select value={selectedBoardForPost} onValueChange={setSelectedBoardForPost}>
                      <SelectTrigger className="h-10 rounded-lg border-gray-200 text-sm cursor-pointer">
                        <SelectValue placeholder="Select a board" />
                      </SelectTrigger>
                      <SelectContent>
                        {boards.map((board) => (
                          <SelectItem key={board.id} value={board.id} className="cursor-pointer">
                            {board.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedBoardForPost && (
                    <GuestPostForm boardId={selectedBoardForPost} onPostCreated={handlePostCreated} />
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-8">
          {/* Left sidebar — Boards */}
          <aside className="w-56 shrink-0 hidden md:block">
            <div className="sticky top-20">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                Boards
              </h2>
              <nav className="space-y-1">
                <button
                  onClick={() => (window.location.href = buildUrl({ board: null }))}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    !currentBoard
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  All Boards
                  <span className={`ml-auto text-xs font-semibold rounded-full px-2 py-0.5 ${
                    !currentBoard ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {posts.length}
                  </span>
                </button>
                {boards.map((board) => {
                  const boardColor = getBoardColor(board.name)
                  const isActive = currentBoard === board.slug
                  const boardPosts = posts.filter(p => {
                    const b = p.boards || boards.find(bb => bb.id === p.board_id)
                    return b?.slug === board.slug
                  })
                  return (
                    <button
                      key={board.id}
                      onClick={() => (window.location.href = buildUrl({ board: board.slug }))}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? `${boardColor.bg} ${boardColor.text} border ${boardColor.border}`
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: isActive ? undefined : '#D1D5DB',
                        }}
                      />
                      {board.name}
                      <span className={`ml-auto text-xs font-semibold rounded-full px-2 py-0.5 ${
                        isActive ? `${boardColor.bg} ${boardColor.text}` : 'bg-gray-100 text-gray-500'
                      }`}>
                        {boardPosts.length}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Search + filters row */}
            <div className="flex items-center gap-3 mb-5">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-lg border-gray-200 bg-white text-sm placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-yellow-300 focus-visible:border-yellow-300"
                />
              </form>

              {/* Status filter */}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => (window.location.href = buildUrl({ status: key }))}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      currentStatus === key
                        ? `${config.bg} ${config.color}`
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>

              {/* Sort toggle */}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    sortBy === 'latest' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setSortBy('most_votes')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    sortBy === 'most_votes' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Top
                </button>
              </div>
            </div>

            {/* Voter email bar */}
            {voterEmail && (
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5 mb-5">
                <p className="text-sm text-gray-600">
                  Voting as <span className="font-medium text-gray-900">{voterEmail}</span>
                </p>
                <button
                  onClick={() => {
                    setVoterEmail('')
                    setVotedPostIds([])
                    toast.success('Email cleared')
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Mobile board selector */}
            <div className="md:hidden mb-5">
              <Select
                value={currentBoard || '__all__'}
                onValueChange={(v) => {
                  window.location.href = buildUrl({ board: v === '__all__' ? null : v })
                }}
              >
                <SelectTrigger className="h-10 rounded-lg border-gray-200 text-sm cursor-pointer">
                  <SelectValue placeholder="All Boards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="cursor-pointer">All Boards</SelectItem>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.slug} className="cursor-pointer">
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Posts list */}
            <div className="space-y-3">
              {sortedPosts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-5 w-5 text-yellow-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No posts yet</p>
                  <p className="text-sm text-gray-500 mt-1">Be the first to share an idea</p>
                </div>
              ) : (
                sortedPosts.map((post) => {
                  const board = post.boards || boards.find((b) => b.id === post.board_id)
                  const tags = tagsByPostId[post.id] || []
                  const isVoted = votedPostIds.includes(post.id)
                  const isVoting = votingIds.includes(post.id)
                  const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.open
                  const authorName = post.is_guest
                    ? post.guest_name || 'Guest'
                    : post.author_name || 'Anonymous'
                  const authorColor = getAuthorColor(authorName)
                  const boardColorConfig = board ? getBoardColor(board.name) : null

                  return (
                    <PostDetailDialog key={post.id} post={post}>
                      <div className="group flex items-stretch bg-white border border-gray-200 rounded-xl hover:border-yellow-200 hover:shadow-[0_2px_12px_rgba(250,204,21,0.08)] transition-all cursor-pointer">
                        {/* Vote button */}
                        <button
                          onClick={(e) => handleVote(post.id, e)}
                          disabled={isVoting}
                          className={`flex flex-col items-center justify-center gap-1 w-16 shrink-0 border-r border-gray-100 transition-colors rounded-l-xl cursor-pointer ${
                            isVoted
                              ? 'bg-yellow-50 text-yellow-600'
                              : 'text-gray-400 hover:bg-gray-50 hover:text-yellow-500'
                          } ${isVoting ? 'opacity-50 cursor-not-allowed!' : ''}`}
                        >
                          <ChevronUp className={`h-4 w-4 ${isVoted ? 'text-yellow-600' : ''}`} />
                          <span className="text-sm font-semibold">{post.vote_count || 0}</span>
                        </button>

                        {/* Content */}
                        <div className="flex-1 px-4 py-3.5 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {post.is_pinned && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                Featured
                              </span>
                            )}
                            {board && boardColorConfig && (
                              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${boardColorConfig.text} ${boardColorConfig.bg} ${boardColorConfig.border}`}>
                                {board.name}
                              </span>
                            )}
                            {tags.map((tag: any) => (
                              <span
                                key={tag.id}
                                className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: tag.color + '18', color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>

                          <h3 className="text-[15px] font-semibold text-gray-900 leading-snug">
                            {post.title}
                          </h3>

                          {post.content && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1 leading-relaxed">
                              {post.content}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs font-medium ${authorColor}`}>
                              {authorName}
                            </span>
                            {post.status && post.status !== 'open' && (
                              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${statusConfig.bg} ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            )}
                            <span className="text-xs font-medium text-blue-500">
                              {new Date(post.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </PostDetailDialog>
                  )
                })
              )}
            </div>
          </main>
        </div>

        {/* Branding footer */}
        {org.show_branding && (
          <div className="mt-16 pb-8 text-center">
            <span className="text-xs text-gray-400">
              Powered by{' '}
              <a
                href="https://kelohq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-500 hover:text-gray-700 transition-colors"
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
