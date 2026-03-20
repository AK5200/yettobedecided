'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { DateRangePicker } from './date-range-picker'
import { BoardFilter } from './board-filter'

// ── Types ──────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  totals: { posts: number; votes: number; comments: number; users: number; completed: number }
  period: { days: number; posts: number; posts_prev: number }
  by_status: Record<string, number>
}

interface TimeseriesPoint {
  date: string
  posts: number
  votes: number
  comments: number
}

interface RecentPost {
  id: string
  title: string
  board: string
  votes: number
  status: string
  priority: string
  time: string
}

interface BoardActivity {
  name: string
  posts: number
  color: string
}

interface PriorityData {
  quick_wins: any[]
  big_bets: any[]
  fill_ins: any[]
  time_sinks: any[]
  drop: any[]
  unscored: any[]
}

interface Contributor {
  id: string
  name: string
  email: string
  avatar_url: string | null
  post_count: number
  vote_count: number
  comment_count: number
}

// ── Sparkline ──────────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const points = data
    .map((v, i) => `${(i / Math.max(data.length - 1, 1)) * 60},${20 - (v / max) * 18}`)
    .join(' ')
  return (
    <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
      <polyline points={points} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
    </svg>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, delta, positive, accent, icon, isDark, spark }: {
  label: string; value: string | number; sub: string; delta: string; positive: boolean;
  accent: string; icon: React.ReactNode; isDark: boolean; spark?: number[]
}) {
  return (
    <div className={`relative rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden ${
      isDark ? 'bg-[#111111] border-white/[0.07] hover:border-white/[0.14]' : 'bg-white border-kelo-border hover:border-kelo-border-dark hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
    }`}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.06] blur-2xl pointer-events-none" style={{ background: accent }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>{icon}</div>
        {spark && <Sparkline data={spark} color={accent} />}
      </div>
      <div className="text-[26px] font-display font-extrabold text-kelo-ink dark:text-white tracking-tight leading-none mb-1">{value}</div>
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-kelo-muted dark:text-white/40">{label}</div>
        {delta && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
            positive ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400'
          }`}>
            {positive ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
      <div className="text-[11px] text-kelo-muted dark:text-white/30 mt-1">{sub}</div>
    </div>
  )
}

// ── Feedback Item ──────────────────────────────────────────────────────────────
function FeedbackItem({ title, board, votes, status, priority, time, isDark }: RecentPost & { isDark: boolean }) {
  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    'open': { label: 'Open', bg: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50', text: isDark ? 'text-indigo-400' : 'text-indigo-600' },
    'under_review': { label: 'In Review', bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50', text: isDark ? 'text-yellow-400' : 'text-yellow-600' },
    'planned': { label: 'Planned', bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50', text: isDark ? 'text-purple-400' : 'text-purple-600' },
    'in_progress': { label: 'In Progress', bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50', text: isDark ? 'text-orange-400' : 'text-orange-600' },
    'shipped': { label: 'Shipped', bg: isDark ? 'bg-green-500/10' : 'bg-green-50', text: isDark ? 'text-green-400' : 'text-green-600' },
    'closed': { label: 'Closed', bg: isDark ? 'bg-gray-500/10' : 'bg-gray-100', text: isDark ? 'text-gray-400' : 'text-gray-500' },
    'completed': { label: 'Completed', bg: isDark ? 'bg-green-500/10' : 'bg-green-50', text: isDark ? 'text-green-400' : 'text-green-600' },
  }
  const priorityDot: Record<string, string> = { quick_wins: '#22c55e', big_bets: '#6366f1', fill_ins: '#F5C518', time_sinks: '#ef4444', drop: '#6b7280', unscored: '#9ca3af' }
  const s = statusConfig[status] || statusConfig['open']
  return (
    <div className={`flex items-center gap-3 py-3 border-b last:border-b-0 ${isDark ? 'border-white/[0.05]' : 'border-kelo-border'}`}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: priorityDot[priority] || '#9ca3af' }} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{title}</div>
        <div className="text-[11px] text-kelo-muted dark:text-white/30 mt-0.5">{board} · {time}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${s.bg} ${s.text}`}>{s.label}</span>
        <span className={`text-xs font-semibold ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>▲ {votes}</span>
      </div>
    </div>
  )
}

// ── Matrix Cell ────────────────────────────────────────────────────────────────
function MatrixCell({ title, subtitle, count, color, borderColor, bgColor, icon, isDark, items }: {
  title: string; subtitle: string; count: number; color: string; borderColor: string;
  bgColor: string; icon: string; isDark: boolean; items: string[]
}) {
  return (
    <div className="rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer" style={{ background: bgColor, borderColor }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: `${color}20` }}>{icon}</div>
          <div>
            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{title}</div>
            <div className="text-[11px] text-kelo-muted dark:text-white/40 mt-0.5">{subtitle}</div>
          </div>
        </div>
        <span className="text-2xl font-display font-extrabold" style={{ color }}>{count}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 4).map((item) => (
          <span key={item} className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${isDark ? 'bg-white/[0.06] text-white/50' : 'bg-white/70 text-kelo-muted'}`}>{item}</span>
        ))}
      </div>
    </div>
  )
}

// ── Unscored Post ──────────────────────────────────────────────────────────────
function UnscoredPost({ post, isDark, onScore }: { post: any; isDark: boolean; onScore: (id: string, cat: string) => void }) {
  const [scored, setScored] = useState<string | null>(null)
  const categories = [
    { key: 'quick_wins', label: 'Quick Win' },
    { key: 'big_bets', label: 'Big Bet' },
    { key: 'fill_ins', label: 'Fill-in' },
    { key: 'time_sinks', label: 'Time Sink' },
  ]
  const catColors: Record<string, string> = { quick_wins: '#22c55e', big_bets: '#6366f1', fill_ins: '#F5C518', time_sinks: '#ef4444' }

  const handleScore = async (cat: string) => {
    setScored(cat)
    onScore(post.id, cat)
  }

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-200 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{post.title}</div>
          <div className="text-[11px] text-kelo-muted dark:text-white/30 mt-0.5">▲ {post.vote_count || 0}</div>
        </div>
        {scored && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-white" style={{ background: catColors[scored] }}>
            {categories.find(c => c.key === scored)?.label}
          </span>
        )}
      </div>
      {!scored ? (
        <div className="grid grid-cols-2 gap-1.5">
          {categories.map((cat) => (
            <button key={cat.key} onClick={() => handleScore(cat.key)}
              className={`text-[11px] font-semibold py-1.5 rounded-xl border transition-all duration-150 hover:scale-[1.02] ${
                isDark ? 'border-white/[0.08] text-white/50 hover:bg-white/[0.06]' : 'border-kelo-border text-kelo-muted hover:bg-kelo-surface'
              }`}
            >{cat.label}</button>
          ))}
        </div>
      ) : (
        <button onClick={() => setScored(null)} className="text-[11px] text-kelo-muted dark:text-white/30 hover:underline">Change category</button>
      )}
    </div>
  )
}

// ── Section Label ──────────────────────────────────────────────────────────────
function SectionLabel({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`text-[11px] font-bold uppercase tracking-[0.1em] ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>{children}</span>
      <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-kelo-border'}`} />
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, isDark }: { active?: boolean; payload?: any[]; label?: string; isDark: boolean }) {
  if (!active || !payload?.length) return null
  return (
    <div className={`rounded-xl border px-3 py-2.5 text-xs shadow-xl ${isDark ? 'bg-[#1a1a1a] border-white/10 text-white' : 'bg-white border-kelo-border text-kelo-ink'}`}>
      <div className="font-semibold mb-1.5 text-kelo-muted dark:text-white/50">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="capitalize text-kelo-muted dark:text-white/50">{p.name}</span>
          <span className="font-bold ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Status color map ──────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  open: '#6366f1',
  under_review: '#f59e0b',
  planned: '#8b5cf6',
  in_progress: '#f97316',
  completed: '#10b981',
  shipped: '#22c55e',
  closed: '#6b7280',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  under_review: 'In Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  shipped: 'Shipped',
  closed: 'Closed',
}

// ── Main Component ────────────────────────────────────────────────────────────
export function KeloDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const searchParams = useSearchParams()
  const days = parseInt(searchParams.get('days') || '30') || 30
  const boardId = searchParams.get('board_id') || undefined

  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)

  // Data states
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([])
  const [recentFeedback, setRecentFeedback] = useState<RecentPost[]>([])
  const [boardActivity, setBoardActivity] = useState<BoardActivity[]>([])
  const [prioritization, setPrioritization] = useState<PriorityData | null>(null)
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [staleCount, setStaleCount] = useState(0)

  // Fetch org
  useEffect(() => {
    const fetchOrg = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id, organizations(name)')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (membership) {
        setOrgId(membership.org_id)
        setOrgName((membership.organizations as any)?.name || 'Your Organization')
      }
    }
    fetchOrg()
  }, [])

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!orgId) return
    setLoading(true)

    const params = new URLSearchParams({ org_id: orgId, days: String(days) })
    if (boardId) params.append('board_id', boardId)

    try {
      const [analyticsRes, timeseriesRes, recentRes, boardRes, prioRes, contribRes, staleRes] = await Promise.all([
        fetch(`/api/analytics?${params}`),
        fetch(`/api/analytics/timeseries?${params}`),
        fetch(`/api/analytics/recent-feedback?${params}&limit=5`),
        fetch(`/api/analytics/board-activity?${params}`),
        fetch(`/api/analytics/prioritization?org_id=${orgId}${boardId ? `&board_id=${boardId}` : ''}`),
        fetch(`/api/widget-users?org_id=${orgId}&sort=posts&limit=4`),
        fetch(`/api/analytics/stale?org_id=${orgId}`),
      ])

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
      if (timeseriesRes.ok) {
        const ts = await timeseriesRes.json()
        setTimeseries(ts.series || [])
      }
      if (recentRes.ok) {
        const rf = await recentRes.json()
        setRecentFeedback(rf.posts || [])
      }
      if (boardRes.ok) {
        const ba = await boardRes.json()
        setBoardActivity(ba.boards || [])
      }
      if (prioRes.ok) setPrioritization(await prioRes.json())
      if (contribRes.ok) {
        const c = await contribRes.json()
        setContributors(c.users || [])
      }
      if (staleRes.ok) {
        const s = await staleRes.json()
        setStaleCount(s.posts?.length || 0)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [orgId, days, boardId])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const handleScore = async (postId: string, category: string) => {
    try {
      await fetch('/api/analytics/prioritization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, priority_category: category }),
      })
    } catch (err) {
      console.error('Failed to score post:', err)
    }
  }

  // Loading skeleton
  if (!orgId || loading) {
    return (
      <div className={`min-h-screen font-sans ${isDark ? 'bg-[#0a0a0a]' : 'bg-kelo-surface'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="h-20 bg-muted animate-pulse rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-64 bg-muted animate-pulse rounded-2xl" />
            <div className="h-64 bg-muted animate-pulse rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // Derived data
  const totalPosts = analytics?.totals.posts || 0
  const totalVotes = analytics?.totals.votes || 0
  const completedPosts = analytics?.totals.completed || 0
  const resolutionRate = totalPosts > 0 ? Math.round((completedPosts / totalPosts) * 100) : 0
  const totalUsers = analytics?.totals.users || 0
  const totalComments = analytics?.totals.comments || 0
  const periodPosts = analytics?.period.posts || 0
  const prevPosts = analytics?.period.posts_prev || 0
  const postsDelta = prevPosts > 0 ? Math.round(((periodPosts - prevPosts) / prevPosts) * 100) : 0

  // Aggregate timeseries into monthly for trend chart
  const monthlyTrend = aggregateMonthly(timeseries)

  // Aggregate last 7 days for weekly chart
  const weeklyActivity = timeseries.slice(-7).map(d => ({
    day: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    posts: d.posts,
    votes: d.votes,
    comments: d.comments,
  }))

  // Status breakdown for pie chart
  const statusBreakdown = Object.entries(analytics?.by_status || {}).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key,
    value,
    color: STATUS_COLORS[key] || '#6b7280',
  }))
  const totalStatus = statusBreakdown.reduce((s, d) => s + d.value, 0)

  // Priority matrix
  const matrixData = [
    { title: 'Quick Wins', subtitle: 'High impact · Low effort', key: 'quick_wins', color: '#22c55e', borderColor: '#22c55e30', bgLight: '#f0fdf4', bgDark: '#22c55e08', icon: '⚡' },
    { title: 'Big Bets', subtitle: 'High impact · High effort', key: 'big_bets', color: '#6366f1', borderColor: '#6366f130', bgLight: '#eef2ff', bgDark: '#6366f108', icon: '🚀' },
    { title: 'Fill-ins', subtitle: 'Low impact · Low effort', key: 'fill_ins', color: '#F5C518', borderColor: '#F5C51830', bgLight: '#fefce8', bgDark: '#F5C51808', icon: '🧩' },
    { title: 'Time Sinks', subtitle: 'Low impact · High effort', key: 'time_sinks', color: '#ef4444', borderColor: '#ef444430', bgLight: '#fef2f2', bgDark: '#ef444408', icon: '⏳' },
  ]

  // Sparkline data from timeseries
  const postsSpark = timeseries.slice(-8).map(d => d.posts)
  const votesSpark = timeseries.slice(-8).map(d => d.votes)
  const commentsSpark = timeseries.slice(-8).map(d => d.comments)

  const kpis = [
    { label: 'Total Posts', value: totalPosts.toLocaleString(), sub: `${periodPosts} in last ${days}d`, delta: postsDelta ? `${Math.abs(postsDelta)}%` : '', positive: postsDelta >= 0, accent: '#6366f1', spark: postsSpark, icon: <svg className="w-4 h-4" style={{ color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'Total Votes', value: totalVotes.toLocaleString(), sub: 'Across all posts', delta: '', positive: true, accent: '#F5C518', spark: votesSpark, icon: <svg className="w-4 h-4" style={{ color: '#F5C518' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg> },
    { label: 'Resolution Rate', value: `${resolutionRate}%`, sub: `${completedPosts} of ${totalPosts} resolved`, delta: '', positive: true, accent: '#22c55e', icon: <svg className="w-4 h-4" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Comments', value: totalComments.toLocaleString(), sub: 'Total comments', delta: '', positive: true, accent: '#3b82f6', spark: commentsSpark, icon: <svg className="w-4 h-4" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
    { label: 'Active Users', value: totalUsers.toLocaleString(), sub: 'Submitted or voted', delta: '', positive: true, accent: '#ec4899', icon: <svg className="w-4 h-4" style={{ color: '#ec4899' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ]

  const unscoredPosts = prioritization?.unscored || []

  // Feedback health metrics
  const openCount = Object.entries(analytics?.by_status || {})
    .filter(([k]) => !['shipped', 'closed', 'completed'].includes(k))
    .reduce((s, [, v]) => s + v, 0)
  const openRate = totalStatus > 0 ? Math.round((openCount / totalStatus) * 100) : 0

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-kelo-surface text-kelo-ink'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
        {/* Greeting + Filters */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-extrabold text-kelo-ink dark:text-white tracking-tight">
                Good morning 👋
              </h1>
              <p className="text-sm text-kelo-muted dark:text-white/40 mt-1">
                Here&apos;s what&apos;s happening across your boards today.
              </p>
            </div>
            <span className={`hidden sm:block text-xs font-semibold px-3 py-1.5 rounded-xl ${isDark ? 'bg-kelo-yellow/10 text-kelo-yellow' : 'bg-yellow-50 text-yellow-700'}`}>
              {orgName}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker defaultDays={days} />
            <BoardFilter orgId={orgId} />
          </div>
        </div>

        {/* KPI Cards */}
        <section>
          <SectionLabel isDark={isDark}>Overview</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {kpis.map((kpi) => <KPICard key={kpi.label} {...kpi} isDark={isDark} />)}
          </div>
        </section>

        {/* Activity */}
        <section>
          <SectionLabel isDark={isDark}>Activity</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Submission Trend */}
            <div className={`lg:col-span-2 rounded-2xl border p-5 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Submission Trend</div>
                  <div className="text-[11px] text-kelo-muted dark:text-white/30 mt-0.5">Posts &amp; votes over time</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="voteGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} />
                  <Area type="monotone" dataKey="posts" stroke="#6366f1" strokeWidth={2} fill="url(#subGrad)" dot={false} />
                  <Area type="monotone" dataKey="votes" stroke="#22c55e" strokeWidth={2} fill="url(#voteGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Status Breakdown */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
              <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Status Breakdown</div>
              <div className="text-[11px] text-kelo-muted dark:text-white/30 mb-4">Current post statuses</div>
              {statusBreakdown.length > 0 ? (
                <>
                  <div className="flex justify-center mb-4">
                    <PieChart width={140} height={140}>
                      <Pie data={statusBreakdown} cx={65} cy={65} innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                        {statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </div>
                  <div className="space-y-2">
                    {statusBreakdown.map((s) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-xs text-kelo-muted dark:text-white/40 flex-1">{s.name}</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{s.value}</span>
                        <span className="text-[10px] text-kelo-muted dark:text-white/25 w-8 text-right">{totalStatus > 0 ? Math.round((s.value / totalStatus) * 100) : 0}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-sm text-kelo-muted dark:text-white/30 text-center py-8">No status data yet</div>
              )}
            </div>
          </div>

          {/* Weekly Activity + Board Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
              <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Weekly Activity</div>
              <div className="text-[11px] text-kelo-muted dark:text-white/30 mb-4">Posts &amp; votes this week</div>
              {weeklyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weeklyActivity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                    <Bar dataKey="posts" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="votes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-kelo-muted dark:text-white/30 text-center py-8">No activity this week</div>
              )}
            </div>

            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
              <div className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Board Activity</div>
              <div className="text-[11px] text-kelo-muted dark:text-white/30 mb-4">Posts per board this period</div>
              {boardActivity.length > 0 ? (
                <div className="space-y-3">
                  {boardActivity.map((b) => {
                    const maxPosts = Math.max(...boardActivity.map(x => x.posts), 1)
                    return (
                      <div key={b.name} className="flex items-center gap-3">
                        <span className={`text-xs font-medium w-16 flex-shrink-0 truncate ${isDark ? 'text-white/50' : 'text-kelo-muted'}`}>{b.name}</span>
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-kelo-surface'}`}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(b.posts / maxPosts) * 100}%`, background: b.color }} />
                        </div>
                        <span className={`text-xs font-bold w-6 text-right ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{b.posts}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-kelo-muted dark:text-white/30 text-center py-8">No boards yet</div>
              )}
            </div>
          </div>
        </section>

        {/* Recent Feedback */}
        <section>
          <SectionLabel isDark={isDark}>Recent Feedback</SectionLabel>
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
            {recentFeedback.length > 0 ? (
              recentFeedback.map((item) => <FeedbackItem key={item.id} {...item} isDark={isDark} />)
            ) : (
              <div className="text-sm text-kelo-muted dark:text-white/30 text-center py-8">No feedback yet. Share your board to start collecting!</div>
            )}
          </div>
        </section>

        {/* Prioritization */}
        <section>
          <SectionLabel isDark={isDark}>Prioritization</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {matrixData.map((cell) => {
              const items = (prioritization?.[cell.key as keyof PriorityData] || []) as any[]
              return (
                <MatrixCell
                  key={cell.title}
                  title={cell.title}
                  subtitle={cell.subtitle}
                  count={items.length}
                  color={cell.color}
                  borderColor={cell.borderColor}
                  bgColor={isDark ? cell.bgDark : cell.bgLight}
                  icon={cell.icon}
                  isDark={isDark}
                  items={items.slice(0, 4).map((p: any) => p.title)}
                />
              )
            })}
          </div>
        </section>

        {/* Unscored Posts */}
        {unscoredPosts.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-[11px] font-bold uppercase tracking-[0.1em] ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>Unscored Posts</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600'}`}>
                {unscoredPosts.length} need scoring
              </span>
              <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-kelo-border'}`} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unscoredPosts.slice(0, 6).map((post: any) => (
                <UnscoredPost key={post.id} post={post} isDark={isDark} onScore={handleScore} />
              ))}
            </div>
          </section>
        )}

        {/* Community & Health */}
        <section>
          <SectionLabel isDark={isDark}>Community &amp; Health</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Contributors */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
              <div className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Top Contributors</div>
              {contributors.length > 0 ? (
                <div className="space-y-3">
                  {contributors.map((c, i) => {
                    const colors = ['#6366f1', '#F5C518', '#22c55e', '#3b82f6']
                    const color = colors[i % colors.length]
                    const initials = (c.name || c.email || '?').slice(0, 2).toUpperCase()
                    const totalEngagement = (c.post_count || 0) + (c.vote_count || 0)
                    const maxEngagement = Math.max(...contributors.map(x => (x.post_count || 0) + (x.vote_count || 0)), 1)
                    return (
                      <div key={c.id || i} className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-4 text-right ${isDark ? 'text-white/20' : 'text-kelo-muted'}`}>{i + 1}</span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: color }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{c.name || c.email}</div>
                          <div className="text-[11px] text-kelo-muted dark:text-white/30">{c.post_count || 0} posts · {c.vote_count || 0} votes</div>
                        </div>
                        <div className={`flex-1 max-w-[80px] h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-kelo-surface'}`}>
                          <div className="h-full rounded-full" style={{ width: `${(totalEngagement / maxEngagement) * 100}%`, background: color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-kelo-muted dark:text-white/30 text-center py-8">No contributors yet</div>
              )}
            </div>

            {/* Feedback Health */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Feedback Health</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                  staleCount > 5
                    ? isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                    : isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                }`}>
                  {staleCount > 5 ? '⚠ Needs attention' : '✓ Healthy'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Resolution Rate', value: `${resolutionRate}%`, color: '#22c55e' },
                  { label: 'Stale Posts', value: String(staleCount), color: staleCount > 5 ? '#ef4444' : '#22c55e' },
                  { label: 'Total Comments', value: totalComments.toLocaleString(), color: '#3b82f6' },
                  { label: 'Open Rate', value: `${openRate}%`, color: '#6366f1' },
                ].map((m) => (
                  <div key={m.label} className={`rounded-xl p-3 ${isDark ? 'bg-white/[0.04]' : 'bg-kelo-surface'}`}>
                    <div className="text-lg font-display font-extrabold" style={{ color: m.color }}>{m.value}</div>
                    <div className="text-[11px] text-kelo-muted dark:text-white/30 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Resolved', value: completedPosts, max: totalPosts || 1, color: '#22c55e' },
                  { label: 'Open', value: openCount, max: totalPosts || 1, color: '#6366f1' },
                  { label: 'Stale (>30d)', value: staleCount, max: totalPosts || 1, color: '#ef4444' },
                ].map((bar) => (
                  <div key={bar.label} className="flex items-center gap-3">
                    <span className={`text-[11px] w-20 flex-shrink-0 ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>{bar.label}</span>
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-kelo-surface'}`}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(bar.value / bar.max) * 100}%`, background: bar.color }} />
                    </div>
                    <span className={`text-[11px] font-bold w-6 text-right ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{bar.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <SectionLabel isDark={isDark}>Quick Actions</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'New Post', icon: '📝', href: '/boards' },
              { label: 'Invite Team', icon: '👥', href: '/settings/team' },
              { label: 'View Roadmap', icon: '🗺️', href: '/roadmap' },
              { label: 'Settings', icon: '⚙️', href: '/settings' },
            ].map((action) => (
              <Link key={action.label} href={action.href}
                className={`rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all duration-150 hover:-translate-y-0.5 ${
                  isDark ? 'bg-[#111111] border-white/[0.07] hover:border-white/[0.14]' : 'bg-white border-kelo-border hover:border-kelo-border-dark hover:shadow-sm'
                }`}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className={`text-xs font-semibold ${isDark ? 'text-white/60' : 'text-kelo-muted'}`}>{action.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function aggregateMonthly(series: TimeseriesPoint[]) {
  const byMonth: Record<string, { posts: number; votes: number; label: string }> = {}
  series.forEach((d) => {
    const date = new Date(d.date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en', { month: 'short' })
    if (!byMonth[key]) byMonth[key] = { posts: 0, votes: 0, label }
    byMonth[key].posts += d.posts
    byMonth[key].votes += d.votes
  })
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
}
