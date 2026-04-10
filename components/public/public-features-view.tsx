'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PostDetailDialog } from '@/components/boards/post-detail-dialog'
import { FeedbackWidget } from '@/components/widgets/feedback-widget'
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

interface StatusDef {
  key: string
  name: string
  color: string
}

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
  statuses: StatusDef[]
}

function buildStatusConfig(statuses: StatusDef[]): Record<string, { label: string; color: string; bg: string; hex: string }> {
  const config: Record<string, { label: string; color: string; bg: string; hex: string }> = {
    all: { label: 'All', color: 'text-muted-foreground', bg: 'bg-muted', hex: '#6B7280' },
  }
  for (const s of statuses) {
    config[s.key] = {
      label: s.name,
      color: '',
      bg: '',
      hex: s.color,
    }
  }
  return config
}

// Deterministic color for author names
const AUTHOR_PALETTE = [
  { text: 'text-blue-600', bg: '#2563EB' },
  { text: 'text-violet-600', bg: '#7C3AED' },
  { text: 'text-emerald-600', bg: '#059669' },
  { text: 'text-rose-600', bg: '#E11D48' },
  { text: 'text-amber-600', bg: '#D97706' },
  { text: 'text-cyan-600', bg: '#0891B2' },
  { text: 'text-indigo-600', bg: '#4F46E5' },
  { text: 'text-teal-600', bg: '#0D9488' },
  { text: 'text-pink-600', bg: '#DB2777' },
  { text: 'text-orange-600', bg: '#EA580C' },
]

function getAuthorStyle(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AUTHOR_PALETTE[Math.abs(hash) % AUTHOR_PALETTE.length]
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
  statuses,
}: PublicFeaturesViewProps) {
  const router = useRouter()
  const STATUS_CONFIG = buildStatusConfig(statuses)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [sortBy, setSortBy] = useState<'latest' | 'most_votes'>('latest')
  const [localPosts, setLocalPosts] = useState(posts)
  const [voterEmail, setVoterEmail] = useState('')
  const [votedPostIds, setVotedPostIds] = useState<string[]>([])
  const [votingIds, setVotingIds] = useState<string[]>([])

  // Get or create anonymous voter ID for guest voting
  const getVoterId = () => {
    if (voterEmail) return voterEmail
    try {
      let anonId = localStorage.getItem('kelo_anon_voter')
      if (!anonId) {
        anonId = 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
        localStorage.setItem('kelo_anon_voter', anonId)
      }
      return anonId
    } catch {
      return 'anon_' + Math.random().toString(36).substring(2)
    }
  }
  const [createPostOpen, setCreatePostOpen] = useState(false)

  // Read shared identity from localStorage or widget_session cookie
  useEffect(() => {
    // First check localStorage (set by widget postMessage or public hub verification)
    try {
      const stored = localStorage.getItem(`kelo_identified_user_${orgSlug}`)
      if (stored) {
        const user = JSON.parse(stored)
        if (user.email && !voterEmail) {
          setVoterEmail(user.email)
          return
        }
      }
    } catch {}

    // Fall back to widget_session cookie (shared auth from widget OAuth)
    fetch('/api/auth/widget/session')
      .then(r => r.json())
      .then(data => {
        if (data.user?.email) {
          setVoterEmail(data.user.email)
          // Persist to localStorage so it's available immediately next time
          try {
            localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(data.user))
          } catch {}
        }
      })
      .catch(() => {})
  }, [orgSlug])

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
    const voterId = getVoterId()
    if (!voterId || boards.length === 0) {
      setVotedPostIds([])
      return
    }
    const fetchVoteStatuses = async () => {
      try {
        const votePromises = boards.map((board) =>
          fetch(
            `/api/votes/by-email?board_id=${board.id}&voter_email=${encodeURIComponent(voterId)}`
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
  }, [voterEmail, boards]) // eslint-disable-line react-hooks/exhaustive-deps

  const guestVotingEnabled = (org as any).guest_voting_enabled !== false
  const [showVoteLogin, setShowVoteLogin] = useState(false)

  const handleVote = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // If guest voting is OFF and user hasn't provided email, show login
    if (!guestVotingEnabled && !voterEmail) {
      setShowVoteLogin(true)
      return
    }
    const voterId = getVoterId()
    if (votingIds.includes(postId)) return
    setVotingIds((prev) => [...prev, postId])

    // Optimistic UI
    const wasVoted = votedPostIds.includes(postId)
    setVotedPostIds((prev) => wasVoted ? prev.filter(id => id !== postId) : [...prev, postId])
    setLocalPosts((prev) => prev.map(p =>
      p.id === postId ? { ...p, vote_count: (p.vote_count ?? 0) + (wasVoted ? -1 : 1) } : p
    ))

    try {
      const response = await fetch('/api/widget/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, email: voterId }),
      })
      if (!response.ok) {
        // Revert
        setVotedPostIds((prev) => wasVoted ? [...prev, postId] : prev.filter(id => id !== postId))
        setLocalPosts((prev) => prev.map(p =>
          p.id === postId ? { ...p, vote_count: (p.vote_count ?? 0) + (wasVoted ? 1 : -1) } : p
        ))
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData?.error || 'Unable to vote. Please try again.')
      }
    } catch {
      // Revert
      setVotedPostIds((prev) => wasVoted ? [...prev, postId] : prev.filter(id => id !== postId))
      setLocalPosts((prev) => prev.map(p =>
        p.id === postId ? { ...p, vote_count: (p.vote_count ?? 0) + (wasVoted ? 1 : -1) } : p
      ))
      toast.error('Failed to vote')
    } finally {
      setVotingIds((prev) => prev.filter((id) => id !== postId))
    }
  }

  const handlePostCreated = () => {
    setCreatePostOpen(false)
    router.refresh()
  }

  const sortedPosts = [...localPosts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    if (sortBy === 'most_votes') return (b.vote_count || 0) - (a.vote_count || 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="min-h-screen bg-muted/50">
      <PublicHubNav org={org} orgSlug={orgSlug} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Feature Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">Browse, vote, and submit ideas</p>
          </div>
          <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 px-4 bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 rounded-lg text-sm font-semibold shadow-sm border border-yellow-400/50 cursor-pointer">
                <Plus className="h-4 w-4 mr-1.5" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg p-0 gap-0 rounded-xl overflow-hidden border-border">
              <DialogHeader className="px-6 pt-6 pb-0">
                <DialogTitle className="text-lg font-semibold text-foreground">Submit feedback</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Share your idea or report an issue</p>
              </DialogHeader>
              {boards.length > 0 && (
                <div className="p-6">
                  <FeedbackWidget
                    boards={boards}
                    orgSlug={orgSlug}
                    onSubmit={() => handlePostCreated()}
                    showBranding={false}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-8">
          {/* Left sidebar — Boards */}
          <aside className="w-56 shrink-0 hidden md:block">
            <div className="sticky top-20">
              <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3 px-3">
                Boards
              </h2>
              <nav className="space-y-1">
                <button
                  onClick={() => (window.location.href = buildUrl({ board: null }))}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    !currentBoard
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  All Boards
                  <span className={`ml-auto text-xs font-semibold rounded-full px-2 py-0.5 ${
                    !currentBoard ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {localPosts.length}
                  </span>
                </button>
                {boards.map((board) => {
                  const boardColor = getBoardColor(board.name)
                  const isActive = currentBoard === board.slug
                  const boardPosts = localPosts.filter(p => {
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
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
                        isActive ? `${boardColor.bg} ${boardColor.text}` : 'bg-muted text-muted-foreground'
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-lg border-border bg-background text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-yellow-300 focus-visible:border-yellow-300"
                />
              </form>

              {/* Status filter */}
              <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => (window.location.href = buildUrl({ status: key }))}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      currentStatus === key
                        ? ''
                        : 'text-muted-foreground hover:text-foreground/80'
                    }`}
                    style={currentStatus === key ? {
                      backgroundColor: config.hex + '18',
                      color: config.hex,
                    } : undefined}
                  >
                    {config.label}
                  </button>
                ))}
              </div>

              {/* Sort toggle */}
              <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    sortBy === 'latest' ? 'bg-muted text-foreground/80' : 'text-muted-foreground hover:text-foreground/80'
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setSortBy('most_votes')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    sortBy === 'most_votes' ? 'bg-muted text-foreground/80' : 'text-muted-foreground hover:text-foreground/80'
                  }`}
                >
                  Top
                </button>
              </div>
            </div>

            {/* Voter email bar */}
            {voterEmail && (
              <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-2.5 mb-5">
                <p className="text-sm text-muted-foreground">
                  Voting as <span className="font-medium text-foreground">{voterEmail}</span>
                </p>
                <button
                  onClick={() => {
                    setVoterEmail('')
                    setVotedPostIds([])
                    toast.success('Email cleared')
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground/80 font-medium cursor-pointer"
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
                <SelectTrigger className="h-10 rounded-lg border-border text-sm cursor-pointer">
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
                  <p className="text-sm font-medium text-foreground">No posts yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to share an idea</p>
                </div>
              ) : (
                sortedPosts.map((post) => {
                  const board = post.boards || boards.find((b) => b.id === post.board_id)
                  const tags = tagsByPostId[post.id] || []
                  const isVoted = votedPostIds.includes(post.id)
                  const isVoting = votingIds.includes(post.id)
                  const statusConfig = STATUS_CONFIG[post.status] || { label: post.status, hex: '#6B7280', color: '', bg: '' }
                  const authorName = post.is_guest
                    ? post.guest_name || 'Guest'
                    : post.author_name || 'Anonymous'
                  const authorStyle = getAuthorStyle(authorName)
                  const boardColorConfig = board ? getBoardColor(board.name) : null

                  return (
                    <PostDetailDialog key={post.id} post={post} orgSlug={orgSlug} guestCommentingEnabled={(org as any).guest_commenting_enabled !== false}>
                      <article className="bg-card rounded-xl p-4 shadow-sm flex gap-4 hover:shadow-md transition-all cursor-pointer">
                        {/* Upvote box */}
                        <button
                          onClick={(e) => handleVote(post.id, e)}
                          disabled={isVoting}
                          className={`w-[60px] h-[64px] shrink-0 border rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
                            isVoted
                              ? 'bg-yellow-50 border-yellow-300 text-yellow-600'
                              : 'bg-background border-border text-foreground/90 hover:bg-muted/50 hover:border-yellow-300'
                          } ${isVoting ? 'opacity-50 cursor-not-allowed!' : ''}`}
                        >
                          <span className="text-2xl font-bold leading-none mb-1">
                            {post.vote_count || 0}
                          </span>
                          <span className={`text-[10px] ${isVoted ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                            Upvote
                          </span>
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Badges row */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {post.is_pinned && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                Featured
                              </span>
                            )}
                            {post.status && (
                              <span
                                className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{ backgroundColor: statusConfig.hex + '18', color: statusConfig.hex }}
                              >
                                {statusConfig.label}
                              </span>
                            )}
                            {board && boardColorConfig && (
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${boardColorConfig.text} ${boardColorConfig.bg}`}>
                                {board.name}
                              </span>
                            )}
                            {tags.map((tag: any) => (
                              <span
                                key={tag.id}
                                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: tag.color + '18', color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>

                          <h3 className="text-lg font-bold text-foreground leading-tight mb-1">
                            {post.title}
                          </h3>

                          {post.content && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                              {post.content}
                            </p>
                          )}

                          {!post.content && <div className="mb-3" />}

                          {/* Author + date */}
                          <div className="flex items-center text-xs text-muted-foreground gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                              style={{ backgroundColor: authorStyle.bg }}
                            >
                              {authorName.charAt(0).toUpperCase()}
                            </div>
                            <span className={`font-medium ${authorStyle.text}`}>{authorName}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <span>
                              {new Date(post.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </article>
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

      {/* Vote login dialog */}
      <Dialog open={showVoteLogin} onOpenChange={setShowVoteLogin}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Verify your identity</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">Verify your identity to vote on posts.</p>
          <div className="space-y-3">
            {(org as any).login_handler === 'customer' && (org as any).sso_redirect_url ? (
              <Button
                className="w-full"
                onClick={() => {
                  window.location.href = `${(org as any).sso_redirect_url}?redirect=${encodeURIComponent(window.location.href)}&kelo=open`
                }}
              >
                Login to {org.name}
              </Button>
            ) : (
              <>
                <Input
                  placeholder="Your email"
                  type="email"
                  value={voterEmail}
                  onChange={(e) => setVoterEmail(e.target.value)}
                />
                <Button
                  className="w-full"
                  disabled={!voterEmail}
                  onClick={() => {
                    try { localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify({ email: voterEmail, name: voterEmail.split('@')[0] })) } catch {}
                    setShowVoteLogin(false)
                  }}
                >
                  Continue with Email
                </Button>
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <span className="relative bg-background px-2 text-xs text-muted-foreground">or</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const popup = window.open(
                      `/api/auth/widget/google?org_slug=${orgSlug}&popup=1`,
                      'kelo-oauth', 'width=500,height=600,left=200,top=100'
                    )
                    const handler = (event: MessageEvent) => {
                      if (event.data?.type === 'kelo:identity' && event.data.user) {
                        setVoterEmail(event.data.user.email)
                        try { localStorage.setItem(`kelo_identified_user_${orgSlug}`, JSON.stringify(event.data.user)) } catch {}
                        setShowVoteLogin(false)
                        window.removeEventListener('message', handler)
                      }
                    }
                    window.addEventListener('message', handler)
                  }}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
