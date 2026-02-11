'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { MessageSquare, ThumbsUp, FileText } from 'lucide-react'

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
  created_at: string
  boards?: { name: string }[] | null
}

interface UserVote {
  id: string
  created_at: string
  posts?: { title: string } | null
}

interface UserComment {
  id: string
  content: string
  created_at: string
  posts?: { title: string } | null
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
  const [banReason, setBanReason] = useState('')
  const [banLoading, setBanLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    setActiveTab('posts')
    fetchPosts()
  }, [user?.id])

  useEffect(() => {
    if (!user?.email) return
    if (activeTab === 'votes' && votes.length === 0) {
      fetchVotes()
    }
    if (activeTab === 'comments' && comments.length === 0) {
      fetchComments()
    }
  }, [activeTab, user?.email])

  const fetchPosts = async () => {
    if (!user?.id) return
    setLoadingPosts(true)
    const { data } = await supabase
      .from('posts')
      .select('id, title, created_at, boards(name)')
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
      .select('id, created_at, posts(title)')
      .eq('voter_email', user.email)
      .order('created_at', { ascending: false })
      .limit(20)
    setVotes(data || [])
    setLoadingVotes(false)
  }

  const fetchComments = async () => {
    if (!user?.email) return
    setLoadingComments(true)
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, posts(title)')
      .eq('author_email', user.email)
      .order('created_at', { ascending: false })
      .limit(20)
    setComments(data || [])
    setLoadingComments(false)
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

  const tabs: { id: TabType; label: string; icon: any; count: number }[] = [
    { id: 'posts', label: 'Posts', icon: FileText, count: user.post_count },
    { id: 'votes', label: 'Votes', icon: ThumbsUp, count: user.vote_count },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: user.comment_count },
  ]

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
                  <div key={post.id} className="text-sm p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="font-medium">{post.title}</div>
                    <div className="text-gray-500">
                      {post.boards?.[0]?.name || 'Board'} · {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
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
                  const postTitle = Array.isArray(vote.posts)
                    ? (vote.posts as any)[0]?.title
                    : (vote.posts as any)?.title
                  return (
                    <div key={vote.id} className="text-sm p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div className="font-medium">{postTitle || 'Unknown post'}</div>
                      <div className="text-gray-500">
                        Voted on {new Date(vote.created_at).toLocaleDateString()}
                      </div>
                    </div>
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
                  const postTitle = Array.isArray(comment.posts)
                    ? (comment.posts as any)[0]?.title
                    : (comment.posts as any)?.title
                  return (
                    <div key={comment.id} className="text-sm p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div className="text-gray-500 text-xs mb-1">
                        On: {postTitle || 'Unknown post'} · {new Date(comment.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-gray-900 line-clamp-2">{comment.content}</div>
                    </div>
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
