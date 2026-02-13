'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { MessageSquare, ThumbsUp, FileText, ChevronLeft, Eye } from 'lucide-react'

type UserSource = 'guest' | 'social_google' | 'social_github' | 'identified' | 'verified_jwt' | 'magic_link'

interface WidgetUser {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  user_source: UserSource
  company_name: string | null
  company_plan: string | null
  company_monthly_spend: number | null
  first_seen_at: string
  last_seen_at: string
  post_count: number
  vote_count: number
  comment_count: number
  is_banned: boolean
  banned_reason: string | null
}

interface RecentPost {
  id: string
  title: string
  board_id: string
  created_at: string
  boards?: { name: string }[] | null
}

interface UserVote {
  id: string
  post_id: string
  created_at: string
  posts?: { title: string; board_id: string } | null
}

interface UserComment {
  id: string
  post_id: string
  content: string
  created_at: string
  posts?: { title: string; board_id: string } | null
}

interface FullPost {
  id: string
  title: string
  content: string | null
  status: string
  vote_count: number
  comment_count: number
  created_at: string
  author_name: string | null
  author_email: string | null
  guest_email: string | null
  boards?: { name: string } | null
  comments?: { id: string; content: string; author_name: string | null; author_email: string | null; created_at: string }[]
}

type TabType = 'posts' | 'votes' | 'comments'

interface UserDetailDrawerProps {
  user: WidgetUser | null
  onOpenChange: (open: boolean) => void
  onUserUpdated: (user: WidgetUser) => void
}

export function UserDetailDrawer({ user, onOpenChange, onUserUpdated }: UserDetailDrawerProps) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabType>('posts')
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
  const [votes, setVotes] = useState<UserVote[]>([])
  const [comments, setComments] = useState<UserComment[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [loadingVotes, setLoadingVotes] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [votesLoaded, setVotesLoaded] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [banLoading, setBanLoading] = useState(false)

  // Inline post detail
  const [selectedPost, setSelectedPost] = useState<FullPost | null>(null)
  const [loadingPost, setLoadingPost] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    setActiveTab('posts')
    setVotes([])
    setComments([])
    setVotesLoaded(false)
    setCommentsLoaded(false)
    setSelectedPost(null)
    fetchPosts()
  }, [user?.id])

  useEffect(() => {
    if (!user?.email) return
    if (activeTab === 'votes' && !votesLoaded) {
      fetchVotes()
    }
    if (activeTab === 'comments' && !commentsLoaded) {
      fetchComments()
    }
  }, [activeTab, user?.email])

  const fetchPosts = async () => {
    if (!user?.id) return
    setLoadingPosts(true)
    const { data } = await supabase
      .from('posts')
      .select('id, title, board_id, created_at, boards(name)')
      .eq('widget_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setRecentPosts(data || [])
    setLoadingPosts(false)
  }

  const fetchVotes = async () => {
    if (!user?.email) return
    setLoadingVotes(true)
    const { data } = await supabase
      .from('votes')
      .select('id, post_id, created_at, posts(title, board_id)')
      .eq('voter_email', user.email)
      .order('created_at', { ascending: false })
      .limit(20)
    setVotes(data || [])
    setVotesLoaded(true)
    setLoadingVotes(false)
  }

  const fetchComments = async () => {
    if (!user?.email) return
    setLoadingComments(true)
    const { data } = await supabase
      .from('comments')
      .select('id, post_id, content, created_at, posts(title, board_id)')
      .eq('author_email', user.email)
      .order('created_at', { ascending: false })
      .limit(20)
    setComments(data || [])
    setCommentsLoaded(true)
    setLoadingComments(false)
  }

  const openPost = async (postId: string) => {
    setLoadingPost(true)
    const [{ data: postData }, { data: commentData }] = await Promise.all([
      supabase
        .from('posts')
        .select('*, boards(name)')
        .eq('id', postId)
        .single(),
      supabase
        .from('comments')
        .select('id, content, author_name, author_email, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
    ])
    if (postData) {
      setSelectedPost({ ...postData, comments: commentData || [] } as FullPost)
    }
    setLoadingPost(false)
  }

  const handleBanToggle = async () => {
    if (!user) return
    setBanLoading(true)
    try {
      const response = await fetch(`/api/widget-users/${user.id}/ban`, {
        method: user.is_banned ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: user.is_banned ? undefined : JSON.stringify({ reason: banReason || undefined }),
      })

      if (!response.ok) {
        throw new Error('Failed to update ban status')
      }

      const updated: WidgetUser = {
        ...user,
        is_banned: !user.is_banned,
        banned_reason: user.is_banned ? null : banReason || null,
      }
      onUserUpdated(updated)
      toast.success(user.is_banned ? 'User unbanned' : 'User banned')
      if (!user.is_banned) setBanReason('')
    } catch (error) {
      toast.error('Failed to update ban status')
    } finally {
      setBanLoading(false)
    }
  }

  if (!user) return null

  const postCount = recentPosts.length
  const voteCount = votesLoaded ? votes.length : user.vote_count
  const commentCount = commentsLoaded ? comments.length : user.comment_count

  const tabs: { id: TabType; label: string; icon: any; count: number }[] = [
    { id: 'posts', label: 'Posts', icon: FileText, count: postCount },
    { id: 'votes', label: 'Votes', icon: ThumbsUp, count: voteCount },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: commentCount },
  ]

  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    planned: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  }

  // Inline post detail view
  if (selectedPost || loadingPost) {
    return (
      <Dialog open={!!user} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1 hover:bg-gray-100 rounded cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              Post Details
            </DialogTitle>
          </DialogHeader>

          {loadingPost ? (
            <div className="text-sm text-gray-500 py-8 text-center">Loading post...</div>
          ) : selectedPost ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedPost.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={statusColors[selectedPost.status] || 'bg-gray-100 text-gray-800'}>
                    {selectedPost.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {(selectedPost.boards as any)?.name || 'Board'}
                  </span>
                  <span className="text-sm text-gray-500">
                    · {new Date(selectedPost.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {selectedPost.content && (
                <div className="text-sm text-gray-700 whitespace-pre-wrap border rounded-lg p-4 bg-gray-50">
                  {selectedPost.content}
                </div>
              )}

              <div className="flex gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" /> {selectedPost.vote_count} votes
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> {selectedPost.comment_count} comments
                </span>
              </div>

              {selectedPost.comments && selectedPost.comments.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3">Comments</h4>
                  <div className="space-y-3">
                    {selectedPost.comments.map((c) => (
                      <div key={c.id} className="text-sm border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {c.author_name || c.author_email || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-gray-700">{c.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || user.email}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-600">
              {(user.name || user.email || '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-lg font-semibold">{user.name || user.email}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="mt-1">
              <Badge variant={user.is_banned ? 'destructive' : 'secondary'}>
                {user.is_banned ? 'Banned' : user.user_source}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">First seen</div>
            <div className="font-medium">{new Date(user.first_seen_at).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500">Last seen</div>
            <div className="font-medium">{new Date(user.last_seen_at).toLocaleString()}</div>
          </div>
        </div>

        {user.company_name && (
          <div className="rounded-lg border p-3 text-sm">
            <div className="font-medium">{user.company_name}</div>
            {user.company_plan && <div className="text-gray-500">Plan: {user.company_plan}</div>}
            {user.company_monthly_spend != null && (
              <div className="text-gray-500">Spend: ${user.company_monthly_spend}</div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span className="text-xs text-gray-400">({tab.count})</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[120px]">
          {activeTab === 'posts' && (
            <div className="space-y-2">
              {loadingPosts ? (
                <div className="text-sm text-gray-500">Loading posts...</div>
              ) : recentPosts.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-6">No posts yet.</div>
              ) : (
                recentPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => openPost(post.id)}
                    className="w-full text-left text-sm p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer group"
                  >
                    <div className="font-medium flex items-center justify-between">
                      <span>{post.title}</span>
                      <Eye className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-gray-500">
                      {post.boards?.[0]?.name || 'Board'} · {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'votes' && (
            <div className="space-y-2">
              {loadingVotes ? (
                <div className="text-sm text-gray-500">Loading votes...</div>
              ) : votes.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-6">No votes yet.</div>
              ) : (
                votes.map((vote) => {
                  const post = Array.isArray(vote.posts) ? (vote.posts as any)[0] : vote.posts
                  const postTitle = post?.title
                  return (
                    <button
                      key={vote.id}
                      onClick={() => openPost(vote.post_id)}
                      className="w-full text-left text-sm p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer group"
                    >
                      <div className="font-medium flex items-center justify-between">
                        <span>{postTitle || 'Unknown post'}</span>
                        <Eye className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-gray-500">
                        Voted on {new Date(vote.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-2">
              {loadingComments ? (
                <div className="text-sm text-gray-500">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-6">No comments yet.</div>
              ) : (
                comments.map((comment) => {
                  const post = Array.isArray(comment.posts) ? (comment.posts as any)[0] : comment.posts
                  const postTitle = post?.title
                  return (
                    <button
                      key={comment.id}
                      onClick={() => openPost(comment.post_id)}
                      className="w-full text-left text-sm p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer group"
                    >
                      <div className="text-gray-500 text-xs mb-1 flex items-center justify-between">
                        <span>On: {postTitle || 'Unknown post'} · {new Date(comment.created_at).toLocaleDateString()}</span>
                        <Eye className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-gray-900 line-clamp-2">{comment.content}</div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t pt-4">
          <div className="text-sm font-medium">{user.is_banned ? 'Unban user' : 'Ban user'}</div>
          {!user.is_banned && (
            <Input
              placeholder="Ban reason (optional)"
              value={banReason}
              onChange={(event) => setBanReason(event.target.value)}
            />
          )}
          <Button variant={user.is_banned ? 'outline' : 'destructive'} onClick={handleBanToggle} disabled={banLoading}>
            {banLoading ? 'Saving...' : user.is_banned ? 'Unban user' : 'Ban user'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
