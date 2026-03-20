'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

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

// ── Source config ────────────────────────────────────────────────────────────
const SOURCE_DISPLAY: Record<UserSource, { label: string; bg: string; darkBg: string; text: string; darkText: string }> = {
  social_google: { label: 'Google', bg: 'bg-blue-50', darkBg: 'bg-blue-500/10', text: 'text-blue-600', darkText: 'text-blue-400' },
  social_github: { label: 'GitHub', bg: 'bg-gray-100', darkBg: 'bg-white/[0.08]', text: 'text-gray-700', darkText: 'text-white/60' },
  identified: { label: 'Identified', bg: 'bg-amber-50', darkBg: 'bg-amber-500/10', text: 'text-amber-700', darkText: 'text-amber-400' },
  verified_jwt: { label: 'Verified JWT', bg: 'bg-green-50', darkBg: 'bg-green-500/10', text: 'text-green-700', darkText: 'text-green-400' },
  magic_link: { label: 'Magic Link', bg: 'bg-purple-50', darkBg: 'bg-purple-500/10', text: 'text-purple-700', darkText: 'text-purple-400' },
  guest: { label: 'Guest', bg: 'bg-gray-100', darkBg: 'bg-white/[0.06]', text: 'text-gray-500', darkText: 'text-white/40' },
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; darkBg: string; text: string; darkText: string }> = {
  open: { label: 'Open', bg: 'bg-indigo-50', darkBg: 'bg-indigo-500/10', text: 'text-indigo-600', darkText: 'text-indigo-400' },
  'in-progress': { label: 'In Progress', bg: 'bg-yellow-50', darkBg: 'bg-yellow-500/10', text: 'text-yellow-700', darkText: 'text-yellow-400' },
  planned: { label: 'Planned', bg: 'bg-purple-50', darkBg: 'bg-purple-500/10', text: 'text-purple-600', darkText: 'text-purple-400' },
  completed: { label: 'Completed', bg: 'bg-green-50', darkBg: 'bg-green-500/10', text: 'text-green-600', darkText: 'text-green-400' },
  shipped: { label: 'Shipped', bg: 'bg-green-50', darkBg: 'bg-green-500/10', text: 'text-green-600', darkText: 'text-green-400' },
  closed: { label: 'Closed', bg: 'bg-gray-100', darkBg: 'bg-white/[0.06]', text: 'text-gray-500', darkText: 'text-white/40' },
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function UserDetailDrawer({ user, onOpenChange, onUserUpdated }: UserDetailDrawerProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
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
    if (activeTab === 'votes' && !votesLoaded) fetchVotes()
    if (activeTab === 'comments' && !commentsLoaded) fetchComments()
  }, [activeTab, user?.email])

  const fetchPosts = async () => {
    if (!user?.id) return
    setLoadingPosts(true)
    const { data } = await supabase.from('posts').select('id, title, board_id, created_at, boards(name)')
      .eq('widget_user_id', user.id).order('created_at', { ascending: false }).limit(20)
    setRecentPosts(data || [])
    setLoadingPosts(false)
  }

  const fetchVotes = async () => {
    if (!user?.email) return
    setLoadingVotes(true)
    const { data } = await supabase.from('votes').select('id, post_id, created_at, posts(title, board_id)')
      .eq('voter_email', user.email).order('created_at', { ascending: false }).limit(20)
    setVotes(data || [])
    setVotesLoaded(true)
    setLoadingVotes(false)
  }

  const fetchComments = async () => {
    if (!user?.email) return
    setLoadingComments(true)
    const { data } = await supabase.from('comments').select('id, post_id, content, created_at, posts(title, board_id)')
      .eq('author_email', user.email).order('created_at', { ascending: false }).limit(20)
    setComments(data || [])
    setCommentsLoaded(true)
    setLoadingComments(false)
  }

  const openPost = async (postId: string) => {
    setLoadingPost(true)
    const [{ data: postData }, { data: commentData }] = await Promise.all([
      supabase.from('posts').select('*, boards(name)').eq('id', postId).single(),
      supabase.from('comments').select('id, content, author_name, author_email, created_at')
        .eq('post_id', postId).order('created_at', { ascending: true })
    ])
    if (postData) setSelectedPost({ ...postData, comments: commentData || [] } as FullPost)
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
      if (!response.ok) throw new Error('Failed to update ban status')
      const updated: WidgetUser = {
        ...user,
        is_banned: !user.is_banned,
        banned_reason: user.is_banned ? null : banReason || null,
      }
      onUserUpdated(updated)
      toast.success(user.is_banned ? 'User unbanned' : 'User banned')
      if (!user.is_banned) setBanReason('')
    } catch {
      toast.error('Failed to update ban status')
    } finally {
      setBanLoading(false)
    }
  }

  if (!user) return null

  const tabs: { id: TabType; label: string; count: number; iconPath: string }[] = [
    { id: 'posts', label: 'Posts', count: user.post_count, iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
    { id: 'votes', label: 'Votes', count: user.vote_count, iconPath: 'M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48a4.53 4.53 0 01-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z' },
    { id: 'comments', label: 'Comments', count: user.comment_count, iconPath: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z' },
  ]

  const src = SOURCE_DISPLAY[user.user_source] || SOURCE_DISPLAY.guest

  // ── Post detail view ────────────────────────────────────────────────────────
  if (selectedPost || loadingPost) {
    return (
      <Dialog open={!!user} onOpenChange={onOpenChange}>
        <DialogContent className={`max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border p-0 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
          <div className={`sticky top-0 z-10 flex items-center gap-3 px-6 py-4 border-b ${isDark ? 'bg-[#111111] border-white/[0.05]' : 'bg-white border-kelo-border'}`}>
            <button
              onClick={() => setSelectedPost(null)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'hover:bg-white/[0.06] text-white/40 hover:text-white' : 'hover:bg-kelo-surface text-kelo-muted hover:text-kelo-ink'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <DialogHeader className="flex-1 p-0">
              <DialogTitle className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Post Details</DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 py-5">
            {loadingPost ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-kelo-yellow border-t-transparent animate-spin" />
              </div>
            ) : selectedPost ? (
              <div className="space-y-5">
                <div>
                  <h3 className={`text-lg font-display font-bold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{selectedPost.title}</h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(() => {
                      const s = STATUS_CONFIG[selectedPost.status] || STATUS_CONFIG.open
                      return <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${isDark ? `${s.darkBg} ${s.darkText}` : `${s.bg} ${s.text}`}`}>{s.label}</span>
                    })()}
                    <span className={`text-xs ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                      {(selectedPost.boards as any)?.name || 'Board'} · {new Date(selectedPost.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {selectedPost.content && (
                  <div className={`text-sm whitespace-pre-wrap rounded-xl p-4 ${isDark ? 'bg-white/[0.04] text-white/70 border border-white/[0.06]' : 'bg-kelo-surface text-kelo-ink/80 border border-kelo-border'}`}>
                    {selectedPost.content}
                  </div>
                )}

                <div className="flex gap-4">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                    {selectedPost.vote_count} votes
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                    {selectedPost.comment_count} comments
                  </span>
                </div>

                {selectedPost.comments && selectedPost.comments.length > 0 && (
                  <div className={`border-t pt-5 ${isDark ? 'border-white/[0.05]' : 'border-kelo-border'}`}>
                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>Comments</h4>
                    <div className="space-y-3">
                      {selectedPost.comments.map((c) => (
                        <div key={c.id} className={`rounded-xl p-3.5 border ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-kelo-surface/50 border-kelo-border'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold ${isDark ? 'text-white/70' : 'text-kelo-ink'}`}>
                              {c.author_name || c.author_email || 'Anonymous'}
                            </span>
                            <span className={`text-[10px] ${isDark ? 'text-white/20' : 'text-kelo-muted/60'}`}>
                              {timeAgo(c.created_at)}
                            </span>
                          </div>
                          <div className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-kelo-ink/80'}`}>{c.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Main drawer ─────────────────────────────────────────────────────────────
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border p-0 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
        {/* Header */}
        <div className={`px-6 pt-6 pb-5 border-b ${isDark ? 'border-white/[0.05]' : 'border-kelo-border'}`}>
          <DialogHeader className="p-0 mb-0">
            <DialogTitle className="sr-only">User Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-start gap-4">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover ring-1 ring-kelo-border dark:ring-white/10" />
            ) : (
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold ${isDark ? 'bg-kelo-yellow/10 text-kelo-yellow' : 'bg-kelo-yellow-light text-kelo-yellow-dark'}`}>
                {(user.name || user.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className={`text-lg font-display font-bold truncate ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                {user.name || user.email}
              </div>
              <div className={`text-sm truncate ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>{user.email}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${isDark ? `${src.darkBg} ${src.darkText}` : `${src.bg} ${src.text}`}`}>
                  {src.label}
                </span>
                {user.is_banned && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                    Banned{user.banned_reason ? `: ${user.banned_reason}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <MiniStat label="First seen" value={new Date(user.first_seen_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} isDark={isDark} />
            <MiniStat label="Last seen" value={timeAgo(user.last_seen_at)} isDark={isDark} />
            {user.company_name && <MiniStat label="Company" value={user.company_name} isDark={isDark} />}
            {user.company_plan && <MiniStat label="Plan" value={user.company_plan} isDark={isDark} />}
            {user.company_monthly_spend != null && <MiniStat label="MRR" value={`$${user.company_monthly_spend}`} isDark={isDark} />}
          </div>

          {/* Engagement summary */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <EngagementPill label="Posts" value={user.post_count} color="#F5C518" isDark={isDark} />
            <EngagementPill label="Votes" value={user.vote_count} color="#6366F1" isDark={isDark} />
            <EngagementPill label="Comments" value={user.comment_count} color="#22C55E" isDark={isDark} />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-white/[0.04]' : 'bg-kelo-surface'}`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? (isDark ? 'bg-white/[0.08] text-white shadow-sm' : 'bg-white text-kelo-ink shadow-sm')
                    : (isDark ? 'text-white/30 hover:text-white/50' : 'text-kelo-muted hover:text-kelo-ink/70')
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.iconPath} />
                </svg>
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  activeTab === tab.id
                    ? (isDark ? 'bg-kelo-yellow/15 text-kelo-yellow' : 'bg-kelo-yellow-light text-kelo-yellow-dark')
                    : (isDark ? 'bg-white/[0.06] text-white/20' : 'bg-kelo-surface-2 text-kelo-muted')
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-6 py-4 min-h-[160px]">
          {activeTab === 'posts' && (
            <TabContent loading={loadingPosts} empty={recentPosts.length === 0} emptyLabel="No posts yet" isDark={isDark}>
              {recentPosts.map((post) => (
                <ItemRow key={post.id} onClick={() => openPost(post.id)} isDark={isDark}>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{post.title}</div>
                    <div className={`text-[11px] mt-0.5 ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                      {post.boards?.[0]?.name || 'Board'} · {timeAgo(post.created_at)}
                    </div>
                  </div>
                  <svg className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${isDark ? 'text-white/30' : 'text-kelo-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </ItemRow>
              ))}
            </TabContent>
          )}

          {activeTab === 'votes' && (
            <TabContent loading={loadingVotes} empty={votes.length === 0} emptyLabel="No votes yet" isDark={isDark}>
              {votes.map((vote) => {
                const post = Array.isArray(vote.posts) ? (vote.posts as any)[0] : vote.posts
                return (
                  <ItemRow key={vote.id} onClick={() => openPost(vote.post_id)} isDark={isDark}>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{post?.title || 'Unknown post'}</div>
                      <div className={`text-[11px] mt-0.5 ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>Voted {timeAgo(vote.created_at)}</div>
                    </div>
                    <svg className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${isDark ? 'text-white/30' : 'text-kelo-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </ItemRow>
                )
              })}
            </TabContent>
          )}

          {activeTab === 'comments' && (
            <TabContent loading={loadingComments} empty={comments.length === 0} emptyLabel="No comments yet" isDark={isDark}>
              {comments.map((comment) => {
                const post = Array.isArray(comment.posts) ? (comment.posts as any)[0] : comment.posts
                return (
                  <ItemRow key={comment.id} onClick={() => openPost(comment.post_id)} isDark={isDark}>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[11px] mb-1 ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                        On: {post?.title || 'Unknown post'} · {timeAgo(comment.created_at)}
                      </div>
                      <div className={`text-sm line-clamp-2 ${isDark ? 'text-white/70' : 'text-kelo-ink/80'}`}>{comment.content}</div>
                    </div>
                    <svg className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${isDark ? 'text-white/30' : 'text-kelo-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </ItemRow>
                )
              })}
            </TabContent>
          )}
        </div>

        {/* Ban section */}
        <div className={`px-6 py-5 border-t ${isDark ? 'border-white/[0.05]' : 'border-kelo-border'}`}>
          <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
            {user.is_banned ? 'Unban user' : 'Moderation'}
          </div>
          {!user.is_banned && (
            <input
              type="text"
              placeholder="Ban reason (optional)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className={`w-full px-4 py-2.5 mb-3 rounded-xl text-sm font-medium border outline-none transition-all duration-200 ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-white/20 focus:border-red-500/40'
                  : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder-kelo-muted/40 focus:border-red-300'
              }`}
            />
          )}
          <button
            onClick={handleBanToggle}
            disabled={banLoading}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
              user.is_banned
                ? (isDark ? 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] border border-white/[0.08]' : 'bg-kelo-surface text-kelo-ink border border-kelo-border hover:bg-kelo-surface-2')
                : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-200 dark:border-red-500/20'
            }`}
          >
            {banLoading ? 'Saving...' : user.is_banned ? 'Unban user' : 'Ban user'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MiniStat({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${isDark ? 'bg-white/[0.04]' : 'bg-kelo-surface'}`}>
      <div className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-white/25' : 'text-kelo-muted/70'}`}>{label}</div>
      <div className={`text-xs font-semibold mt-0.5 truncate ${isDark ? 'text-white/70' : 'text-kelo-ink'}`}>{value}</div>
    </div>
  )
}

function EngagementPill({ label, value, color, isDark }: { label: string; value: number; color: string; isDark: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-kelo-border'}`}>
      <span className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>{label}</span>
      <span className="text-sm font-display font-extrabold" style={{ color }}>{value}</span>
    </div>
  )
}

function TabContent({ loading, empty, emptyLabel, isDark, children }: {
  loading: boolean; empty: boolean; emptyLabel: string; isDark: boolean; children: React.ReactNode
}) {
  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <div className="w-5 h-5 rounded-full border-2 border-kelo-yellow border-t-transparent animate-spin" />
    </div>
  )
  if (empty) return (
    <div className="flex flex-col items-center justify-center py-10">
      <span className={`text-sm ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>{emptyLabel}</span>
    </div>
  )
  return <div className="space-y-1.5">{children}</div>
}

function ItemRow({ onClick, isDark, children }: { onClick: () => void; isDark: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left px-3 py-3 rounded-xl transition-all duration-150 cursor-pointer group ${
        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-kelo-surface/60'
      }`}
    >
      {children}
    </button>
  )
}
