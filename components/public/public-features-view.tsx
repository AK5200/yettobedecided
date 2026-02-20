'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PostDetailDialog } from '@/components/boards/post-detail-dialog'
import { GuestPostForm } from '@/components/posts/guest-post-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MessageSquare, ThumbsUp, Bug, Lightbulb, Link2, Plus } from 'lucide-react'
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
    currentBoard ? boards.find(b => b.slug === currentBoard)?.id || boards[0]?.id || '' : boards[0]?.id || ''
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (currentBoard) params.set('board', currentBoard)
    if (currentStatus !== 'all') params.set('status', currentStatus)
    if (searchQuery) params.set('q', searchQuery)
    window.location.href = `/${orgSlug}/features?${params.toString()}`
  }

  const getBoardIcon = (boardName: string) => {
    const name = boardName.toLowerCase()
    if (name.includes('bug')) return <Bug className="h-4 w-4" />
    if (name.includes('feature')) return <Lightbulb className="h-4 w-4" />
    if (name.includes('feedback')) return <MessageSquare className="h-4 w-4" />
    if (name.includes('integration')) return <Link2 className="h-4 w-4" />
    return <MessageSquare className="h-4 w-4" />
  }

  // Fetch vote statuses for all boards
  useEffect(() => {
    if (!voterEmail || boards.length === 0) {
      setVotedPostIds([])
      return
    }

    const fetchVoteStatuses = async () => {
      try {
        // Fetch votes for each board and combine
        const votePromises = boards.map(board =>
          fetch(`/api/votes/by-email?board_id=${board.id}&voter_email=${encodeURIComponent(voterEmail)}`)
            .then(res => res.ok ? res.json() : { post_ids: [] })
            .then(data => data.post_ids || [])
            .catch(() => [])
        )

        const allVotedIds = await Promise.all(votePromises)
        const uniqueIds = Array.from(new Set(allVotedIds.flat()))
        setVotedPostIds(uniqueIds)
      } catch (error) {
        // Silently fail
      }
    }

    fetchVoteStatuses()
  }, [voterEmail, boards])

  const handleVote = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!voterEmail) {
      const email = window.prompt('Please enter your email to vote:')
      if (!email) return
      setVoterEmail(email)
      // Retry vote after setting email
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
        toast.error(errorData?.error || 'Unable to update vote. Please try again.')
        return
      }

      toast.success('Vote updated!')
      router.refresh()
    } catch (error) {
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
    // Featured posts always come first
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1

    // Then apply the selected sort
    if (sortBy === 'most_votes') {
      return (b.vote_count || 0) - (a.vote_count || 0)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-4">
            <nav className="flex gap-4 text-sm">
              <Link href={`/${orgSlug}/features`} className="font-medium">
                Features
              </Link>
              <Link href={`/${orgSlug}/roadmap`} className="text-muted-foreground">
                Roadmap
              </Link>
              <Link href={`/${orgSlug}/changelog`} className="text-muted-foreground">
                Changelog
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Boards */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-28">
              <h2 className="text-sm font-semibold mb-4">Boards</h2>
              <nav className="space-y-1">
                <Link
                  href={`/${orgSlug}/features${currentStatus !== 'all' ? `?status=${currentStatus}` : ''}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    !currentBoard
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  All Boards
                </Link>
                {boards.map((board) => {
                  const isActive = currentBoard === board.slug
                  return (
                    <Link
                      key={board.id}
                      href={`/${orgSlug}/features?board=${board.slug}${currentStatus !== 'all' ? `&status=${currentStatus}` : ''}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {getBoardIcon(board.name)}
                      {board.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Create New Post Button */}
            <div className="mb-6">
              <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full md:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                  </DialogHeader>
                  {boards.length > 0 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Board</label>
                        <Select value={selectedBoardForPost} onValueChange={setSelectedBoardForPost}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a board" />
                          </SelectTrigger>
                          <SelectContent>
                            {boards.map((board) => (
                              <SelectItem key={board.id} value={board.id}>
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

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              {/* Voter Email Input */}
              <div className="p-3 bg-muted rounded-md">
                <label className="text-sm font-medium mb-2 block">Your Email (for voting)</label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email to vote on posts"
                    value={voterEmail}
                    onChange={(e) => setVoterEmail(e.target.value)}
                    className="flex-1"
                  />
                  {voterEmail && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setVoterEmail('')
                        setVotedPostIds([])
                        toast.success('Email cleared')
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant={currentStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams()
                      if (currentBoard) params.set('board', currentBoard)
                      if (searchQuery) params.set('q', searchQuery)
                      window.location.href = `/${orgSlug}/features?${params.toString()}`
                    }}
                  >
                    All
                  </Button>
                  <Button
                    variant={currentStatus === 'open' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams()
                      if (currentBoard) params.set('board', currentBoard)
                      params.set('status', 'open')
                      if (searchQuery) params.set('q', searchQuery)
                      window.location.href = `/${orgSlug}/features?${params.toString()}`
                    }}
                  >
                    Open
                  </Button>
                  <Button
                    variant={currentStatus === 'planned' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams()
                      if (currentBoard) params.set('board', currentBoard)
                      params.set('status', 'planned')
                      if (searchQuery) params.set('q', searchQuery)
                      window.location.href = `/${orgSlug}/features?${params.toString()}`
                    }}
                  >
                    Planned
                  </Button>
                  <Button
                    variant={currentStatus === 'in_progress' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams()
                      if (currentBoard) params.set('board', currentBoard)
                      params.set('status', 'in_progress')
                      if (searchQuery) params.set('q', searchQuery)
                      window.location.href = `/${orgSlug}/features?${params.toString()}`
                    }}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant={currentStatus === 'shipped' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams()
                      if (currentBoard) params.set('board', currentBoard)
                      params.set('status', 'shipped')
                      if (searchQuery) params.set('q', searchQuery)
                      window.location.href = `/${orgSlug}/features?${params.toString()}`
                    }}
                  >
                    Shipped
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={sortBy === 'latest' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('latest')}
                  >
                    Latest
                  </Button>
                  <Button
                    variant={sortBy === 'most_votes' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('most_votes')}
                  >
                    Most Votes
                  </Button>
                </div>
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {sortedPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No posts found.</p>
                </div>
              ) : (
                sortedPosts.map((post) => {
                  const board = post.boards || boards.find((b) => b.id === post.board_id)
                  const tags = tagsByPostId[post.id] || []
                  return (
                    <PostDetailDialog key={post.id} post={post}>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {post.is_pinned && (
                                  <Badge variant="secondary" className="text-xs">
                                    Featured
                                  </Badge>
                                )}
                                {board && (
                                  <Badge variant="outline" className="text-xs">
                                    {board.name}
                                  </Badge>
                                )}
                                {tags.map((tag: any) => (
                                  <Badge
                                    key={tag.id}
                                    className="text-xs"
                                    style={{ backgroundColor: tag.color, color: '#fff' }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                              <h3 className="text-lg font-semibold">{post.title}</h3>
                              {post.content && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>By {post.is_guest ? (post.guest_name || 'Guest') : (post.author_name || 'Anonymous')}</span>
                                {post.status && (
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {post.status.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={(e) => handleVote(post.id, e)}
                                disabled={votingIds.includes(post.id)}
                                className={`flex flex-col items-center gap-1 transition-colors ${
                                  votedPostIds.includes(post.id)
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-primary'
                                } ${votingIds.includes(post.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <ThumbsUp className={`h-5 w-5 ${votedPostIds.includes(post.id) ? 'fill-current' : ''}`} />
                                <span className="text-sm font-medium">{post.vote_count || 0}</span>
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </PostDetailDialog>
                  )
                })
              )}
            </div>
          </main>
        </div>

        {/* Footer */}
        {org.show_branding && (
          <div className="mt-12 text-center text-sm text-muted-foreground">
            Powered by Kelo
          </div>
        )}
      </div>
    </div>
  )
}
