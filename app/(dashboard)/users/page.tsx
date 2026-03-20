'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { UserDetailDrawer } from '@/components/dashboard/user-detail-drawer'

type UserSource = 'guest' | 'social_google' | 'social_github' | 'identified' | 'verified_jwt' | 'magic_link'
type SortField = 'last_seen_at' | 'post_count' | 'vote_count' | 'comment_count' | 'first_seen_at'

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

// ── Source config ────────────────────────────────────────────────────────────
const SOURCE_CONFIG: Record<UserSource, { label: string; color: string; bg: string; darkBg: string; darkText: string; icon: string }> = {
  social_google: { label: 'Google', color: 'text-blue-600', bg: 'bg-blue-50', darkBg: 'bg-blue-500/10', darkText: 'text-blue-400', icon: 'G' },
  social_github: { label: 'GitHub', color: 'text-gray-700', bg: 'bg-gray-100', darkBg: 'bg-white/[0.08]', darkText: 'text-white/60', icon: '⌥' },
  identified: { label: 'Identified', color: 'text-amber-700', bg: 'bg-amber-50', darkBg: 'bg-amber-500/10', darkText: 'text-amber-400', icon: '◉' },
  verified_jwt: { label: 'Verified', color: 'text-green-700', bg: 'bg-green-50', darkBg: 'bg-green-500/10', darkText: 'text-green-400', icon: '✓' },
  magic_link: { label: 'Email', color: 'text-purple-700', bg: 'bg-purple-50', darkBg: 'bg-purple-500/10', darkText: 'text-purple-400', icon: '✉' },
  guest: { label: 'Guest', color: 'text-gray-500', bg: 'bg-gray-100', darkBg: 'bg-white/[0.06]', darkText: 'text-white/40', icon: '○' },
}

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'last_seen_at', label: 'Last seen' },
  { value: 'first_seen_at', label: 'First seen' },
  { value: 'post_count', label: 'Most posts' },
  { value: 'vote_count', label: 'Most votes' },
  { value: 'comment_count', label: 'Most comments' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function UsersPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const [users, setUsers] = useState<WidgetUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<UserSource | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('last_seen_at')
  const [selectedUser, setSelectedUser] = useState<WidgetUser | null>(null)
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: memberships } = await supabase
      .from('org_members').select('org_id').eq('user_id', user.id)

    const orgIds = (memberships || []).map((m: { org_id: string }) => m.org_id)
    if (orgIds.length === 0) { setLoading(false); return }

    const { data: widgetUsers } = await supabase
      .from('widget_users').select('*').in('org_id', orgIds).order('last_seen_at', { ascending: false })

    setUsers(widgetUsers || [])
    setLoading(false)
  }

  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => {
      const matchesSearch = u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSource = sourceFilter === 'all' || u.user_source === sourceFilter
      return matchesSearch && matchesSource
    })
    result.sort((a, b) => {
      if (sortField === 'last_seen_at' || sortField === 'first_seen_at') {
        return new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime()
      }
      return (b[sortField] as number) - (a[sortField] as number)
    })
    return result
  }, [users, searchQuery, sourceFilter, sortField])

  // Stats
  const totalUsers = users.length
  const activeToday = users.filter(u => {
    const diff = Date.now() - new Date(u.last_seen_at).getTime()
    return diff < 86400000
  }).length
  const bannedCount = users.filter(u => u.is_banned).length
  const sourceCounts = users.reduce((acc, u) => { acc[u.user_source] = (acc[u.user_source] || 0) + 1; return acc }, {} as Record<string, number>)
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className={`inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold tracking-widest uppercase ${
          isDark ? 'border-white/10 bg-white/5 text-white/40' : 'border-kelo-border bg-kelo-surface text-kelo-muted'
        }`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 015 19.128M15 19.128v-.003c0-.955-.206-1.862-.573-2.68m0 0a6.375 6.375 0 00-5.427-3.82M9 7.5a3.375 3.375 0 11-6.75 0A3.375 3.375 0 019 7.5zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          Users
        </div>
        <h1 className={`text-3xl md:text-4xl font-display font-extrabold tracking-tight leading-tight mb-2 ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
          Your audience
        </h1>
        <p className={`text-base ${isDark ? 'text-white/50' : 'text-kelo-muted'}`}>
          Everyone who has interacted with your feedback boards.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KPICard label="Total users" value={totalUsers} accent="#F5C518" isDark={isDark}
          icon={<svg className="w-4 h-4" style={{ color: '#F5C518' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 015 19.128M9 7.5a3.375 3.375 0 11-6.75 0A3.375 3.375 0 019 7.5zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <KPICard label="Active today" value={activeToday} accent="#22C55E" isDark={isDark}
          icon={<svg className="w-4 h-4" style={{ color: '#22C55E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
        />
        <KPICard label="Banned" value={bannedCount} accent="#EF4444" isDark={isDark}
          icon={<svg className="w-4 h-4" style={{ color: '#EF4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
        />
        <KPICard label={topSource ? `Top: ${SOURCE_CONFIG[topSource[0] as UserSource]?.label || topSource[0]}` : 'Sources'} value={topSource ? topSource[1] : 0} accent="#6366F1" isDark={isDark}
          icon={<svg className="w-4 h-4" style={{ color: '#6366F1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>}
        />
      </div>

      {/* Filters bar */}
      <div className={`flex flex-col sm:flex-row gap-3 mb-6 p-4 rounded-2xl border ${
        isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
      }`}>
        {/* Search */}
        <div className="flex-1 relative">
          <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/30' : 'text-kelo-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all duration-200 ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-white/30 focus:border-kelo-yellow/40 focus:bg-white/[0.06]'
                : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder-kelo-muted/60 focus:border-kelo-yellow/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,197,24,0.1)]'
            }`}
          />
        </div>

        {/* Source filter dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowSourceDropdown(!showSourceDropdown); setShowSortDropdown(false) }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 min-w-[140px] ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
                : 'bg-kelo-surface border-kelo-border text-kelo-muted hover:bg-kelo-surface-2'
            } ${sourceFilter !== 'all' ? (isDark ? 'border-kelo-yellow/30 text-kelo-yellow' : 'border-kelo-yellow/40 text-kelo-yellow-dark') : ''}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            {sourceFilter === 'all' ? 'All sources' : SOURCE_CONFIG[sourceFilter]?.label}
            <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
          {showSourceDropdown && (
            <div className={`absolute top-full mt-2 right-0 w-48 rounded-xl border shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 py-1 ${
              isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-kelo-border'
            }`}>
              {[{ value: 'all' as const, label: 'All sources' }, ...Object.entries(SOURCE_CONFIG).map(([k, v]) => ({ value: k as UserSource, label: v.label }))].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSourceFilter(opt.value); setShowSourceDropdown(false) }}
                  className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                    sourceFilter === opt.value
                      ? (isDark ? 'bg-kelo-yellow/10 text-kelo-yellow' : 'bg-kelo-yellow-light text-kelo-yellow-dark')
                      : (isDark ? 'text-white/60 hover:bg-white/[0.06]' : 'text-kelo-muted hover:bg-kelo-surface')
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowSortDropdown(!showSortDropdown); setShowSourceDropdown(false) }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 min-w-[140px] ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
                : 'bg-kelo-surface border-kelo-border text-kelo-muted hover:bg-kelo-surface-2'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 16.5m0 0L12 12m4.5 4.5V3" />
            </svg>
            {SORT_OPTIONS.find(s => s.value === sortField)?.label}
            <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
          {showSortDropdown && (
            <div className={`absolute top-full mt-2 right-0 w-48 rounded-xl border shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 py-1 ${
              isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-kelo-border'
            }`}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortField(opt.value); setShowSortDropdown(false) }}
                  className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                    sortField === opt.value
                      ? (isDark ? 'bg-kelo-yellow/10 text-kelo-yellow' : 'bg-kelo-yellow-light text-kelo-yellow-dark')
                      : (isDark ? 'text-white/60 hover:bg-white/[0.06]' : 'text-kelo-muted hover:bg-kelo-surface')
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {(showSourceDropdown || showSortDropdown) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowSourceDropdown(false); setShowSortDropdown(false) }} />
      )}

      {/* Results count */}
      <div className={`flex items-center justify-between mb-4`}>
        <span className={`text-xs font-medium ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          {sourceFilter !== 'all' && ` · filtered by ${SOURCE_CONFIG[sourceFilter]?.label}`}
        </span>
      </div>

      {/* Users table */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'
      }`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-kelo-yellow border-t-transparent animate-spin mb-4" />
            <span className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/[0.06]' : 'bg-kelo-surface'}`}>
              <svg className={`w-7 h-7 ${isDark ? 'text-white/20' : 'text-kelo-muted/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 015 19.128M9 7.5a3.375 3.375 0 11-6.75 0A3.375 3.375 0 019 7.5zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>No users found</span>
            <span className={`text-xs mt-1 ${isDark ? 'text-white/20' : 'text-kelo-muted/60'}`}>
              {searchQuery ? 'Try a different search term' : 'Users will appear when they interact with your widget'}
            </span>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className={`grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-semibold tracking-wider uppercase border-b ${
              isDark ? 'bg-white/[0.03] border-white/[0.05] text-white/30' : 'bg-kelo-surface/50 border-kelo-border text-kelo-muted'
            }`}>
              <div className="col-span-4">User</div>
              <div className="col-span-2">Source</div>
              <div className="col-span-3">Engagement</div>
              <div className="col-span-2">Last seen</div>
              <div className="col-span-1">Status</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-kelo-border dark:divide-white/[0.05]">
              {filteredUsers.map((user) => {
                const src = SOURCE_CONFIG[user.user_source] || SOURCE_CONFIG.guest
                const totalActivity = user.post_count + user.vote_count + user.comment_count
                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full grid grid-cols-12 gap-4 px-5 py-3.5 text-left items-center transition-all duration-150 group cursor-pointer ${
                      isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-kelo-surface/50'
                    }`}
                  >
                    {/* User info */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0 ring-1 ring-kelo-border dark:ring-white/10" />
                      ) : (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          isDark ? 'bg-kelo-yellow/10 text-kelo-yellow' : 'bg-kelo-yellow-light text-kelo-yellow-dark'
                        }`}>
                          {(user.name || user.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
                          {user.name || user.email?.split('@')[0] || 'Anonymous'}
                        </div>
                        <div className={`text-xs truncate ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                          {user.email}
                          {user.company_name && <span className={isDark ? 'text-white/20' : 'text-kelo-muted/60'}> · {user.company_name}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Source badge */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg ${isDark ? `${src.darkBg} ${src.darkText}` : `${src.bg} ${src.color}`}`}>
                        {src.label}
                      </span>
                    </div>

                    {/* Engagement */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-white/50' : 'text-kelo-muted'}`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                          {user.post_count}
                        </span>
                        <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-white/50' : 'text-kelo-muted'}`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                          {user.vote_count}
                        </span>
                        <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-white/50' : 'text-kelo-muted'}`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                          {user.comment_count}
                        </span>
                      </div>
                      {/* Mini activity bar */}
                      {totalActivity > 0 && (
                        <div className={`hidden lg:flex h-1.5 rounded-full overflow-hidden flex-1 max-w-[60px] ${isDark ? 'bg-white/[0.06]' : 'bg-kelo-surface'}`}>
                          <div className="h-full bg-kelo-yellow rounded-full" style={{ width: `${Math.min((user.post_count / totalActivity) * 100, 100)}%` }} />
                          <div className="h-full bg-indigo-400" style={{ width: `${Math.min((user.vote_count / totalActivity) * 100, 100)}%` }} />
                          <div className="h-full bg-emerald-400" style={{ width: `${Math.min((user.comment_count / totalActivity) * 100, 100)}%` }} />
                        </div>
                      )}
                    </div>

                    {/* Last seen */}
                    <div className={`col-span-2 text-xs font-medium ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                      {timeAgo(user.last_seen_at)}
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                          Banned
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                          isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
                        }`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* User Detail Drawer */}
      <UserDetailDrawer
        user={selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
        onUserUpdated={(updated) => {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
          setSelectedUser(updated)
        }}
      />
    </div>
  )
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ label, value, accent, isDark, icon }: {
  label: string; value: number; accent: string; isDark: boolean; icon: React.ReactNode
}) {
  return (
    <div className={`relative rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden ${
      isDark ? 'bg-[#111111] border-white/[0.07] hover:border-white/[0.14]' : 'bg-white border-kelo-border hover:border-kelo-border-dark hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
    }`}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.06] blur-2xl pointer-events-none" style={{ background: accent }} />
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${accent}18` }}>{icon}</div>
      <div className={`text-[26px] font-display font-extrabold tracking-tight leading-none mb-1 ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{value}</div>
      <div className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>{label}</div>
    </div>
  )
}
