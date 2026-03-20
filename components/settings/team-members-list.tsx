'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

interface TeamMembersListProps {
  members: any[]
  invitations: any[]
  orgId: string
  currentUserRole: string
}

function RoleDropdown({
  value,
  onChange,
  disabled,
  isDark,
}: {
  value: string
  onChange: (role: 'admin' | 'member') => void
  disabled: boolean
  isDark: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-2 w-28 h-9 px-3 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
          isDark
            ? 'bg-white/[0.04] border-white/[0.08] text-white hover:border-white/[0.16]'
            : 'bg-kelo-surface border-kelo-border text-kelo-ink hover:border-kelo-ink/20'
        }`}
      >
        <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
        {/* Chevron */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className={`absolute right-0 top-full mt-1 w-28 rounded-lg border shadow-lg z-50 overflow-hidden ${
          isDark
            ? 'bg-[#1a1a1a] border-white/[0.08]'
            : 'bg-white border-kelo-border'
        }`}>
          {(['admin', 'member'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                onChange(r)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors ${
                value === r
                  ? 'bg-kelo-yellow/20 text-kelo-ink dark:text-kelo-yellow'
                  : isDark
                    ? 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                    : 'text-kelo-muted hover:bg-kelo-surface hover:text-kelo-ink'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TeamMembersList({ members, invitations, orgId, currentUserRole }: TeamMembersListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const handleRoleChange = async (userId: string, role: 'admin' | 'member') => {
    setLoadingId(userId)
    const response = await fetch(`/api/team/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, role }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to update role.')
    } else {
      toast.success('Role updated!')
      router.refresh()
    }

    setLoadingId(null)
  }

  const handleRemove = async (userId: string) => {
    const confirmed = window.confirm('Remove this member from the organization?')
    if (!confirmed) return

    setLoadingId(userId)
    const response = await fetch(`/api/team/${userId}?org_id=${orgId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to remove member.')
    } else {
      toast.success('Member removed.')
      router.refresh()
    }

    setLoadingId(null)
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner':
        return isDark
          ? 'bg-kelo-yellow/20 text-kelo-yellow'
          : 'bg-amber-100 text-amber-700'
      case 'admin':
        return isDark
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-blue-100 text-blue-700'
      default:
        return isDark
          ? 'bg-white/[0.06] text-white/50'
          : 'bg-kelo-surface text-kelo-muted'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 .932.638l5.669.094a.5.5 0 0 1 .29.888l-4.373 3.51a1 1 0 0 0-.337 1.07l1.568 5.4a.5.5 0 0 1-.756.543l-4.853-3.126a1 1 0 0 0-1.06 0l-4.853 3.126a.5.5 0 0 1-.756-.543l1.568-5.4a1 1 0 0 0-.337-1.07L3.72 10.49a.5.5 0 0 1 .289-.888l5.669-.094a1 1 0 0 0 .932-.638z" />
          </svg>
        )
      case 'admin':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          </svg>
        )
      default:
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Active Members */}
      <div className={`rounded-2xl border p-6 transition-all duration-200 ${
        isDark
          ? 'bg-[#111111] border-white/[0.07]'
          : 'bg-white border-kelo-border'
      }`}>
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2.5 bg-kelo-yellow/20 rounded-xl shrink-0">
            {/* Users icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kelo-yellow-dark">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-display font-extrabold text-kelo-ink dark:text-white">Team Members</h3>
              <span className={`inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-lg text-xs font-bold ${
                isDark
                  ? 'bg-kelo-yellow/20 text-kelo-yellow'
                  : 'bg-kelo-yellow/20 text-kelo-ink'
              }`}>
                {members.length}
              </span>
            </div>
            <p className="text-sm text-kelo-muted dark:text-white/40 mt-0.5">
              People with access to your organization.
            </p>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-10">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isDark ? 'bg-white/[0.04]' : 'bg-kelo-surface'
            }`}>
              {/* UserX icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kelo-muted dark:text-white/30">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="17" y1="8" x2="23" y2="14" />
                <line x1="23" y1="8" x2="17" y2="14" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-kelo-muted dark:text-white/40">No members found</p>
            <p className="text-xs text-kelo-muted/60 dark:text-white/20 mt-1">Invite someone to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const role = member.role as 'owner' | 'admin' | 'member'
              const email = member.email || member.user_email || member.user_id
              const name = member.name || null
              const displayName = name || email
              return (
                <div
                  key={member.user_id}
                  className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${
                    isDark
                      ? 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
                      : 'bg-kelo-surface/50 border-kelo-border/50 hover:border-kelo-border'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-kelo-yellow flex items-center justify-center text-kelo-ink font-bold text-sm shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {name && (
                          <span className="text-sm font-semibold text-kelo-ink dark:text-white truncate">{name}</span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${getRoleBadgeClass(role)}`}>
                          {getRoleIcon(role)}
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-kelo-muted dark:text-white/40 truncate">{email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {role !== 'owner' && currentUserRole === 'owner' && (
                      <>
                        <RoleDropdown
                          value={role}
                          onChange={(newRole) => handleRoleChange(member.user_id, newRole)}
                          disabled={loadingId === member.user_id}
                          isDark={isDark}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemove(member.user_id)}
                          disabled={loadingId === member.user_id}
                          className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
                            isDark
                              ? 'text-white/30 hover:text-red-400 hover:bg-red-500/10'
                              : 'text-kelo-muted/60 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {/* Trash icon */}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      <div className={`rounded-2xl border p-6 transition-all duration-200 ${
        isDark
          ? 'bg-[#111111] border-white/[0.07]'
          : 'bg-white border-kelo-border'
      }`}>
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            isDark ? 'bg-orange-500/20' : 'bg-orange-100'
          }`}>
            {/* Clock icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isDark ? 'text-orange-400' : 'text-orange-600'}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-display font-extrabold text-kelo-ink dark:text-white">Pending Invitations</h3>
              {invitations.length > 0 && (
                <span className={`inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-lg text-xs font-bold ${
                  isDark
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {invitations.length}
                </span>
              )}
            </div>
            <p className="text-sm text-kelo-muted dark:text-white/40 mt-0.5">
              Invitations waiting to be accepted.
            </p>
          </div>
        </div>

        {invitations.length === 0 ? (
          <div className="text-center py-10">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isDark ? 'bg-white/[0.04]' : 'bg-kelo-surface'
            }`}>
              {/* Clock icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kelo-muted dark:text-white/30">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-kelo-muted dark:text-white/40">No pending invitations</p>
            <p className="text-xs text-kelo-muted/60 dark:text-white/20 mt-1">All invitations have been accepted.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invitations.map((invite) => (
              <div
                key={invite.id}
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  isDark
                    ? 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
                    : 'bg-kelo-surface/50 border-kelo-border/50 hover:border-kelo-border'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    isDark
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    {invite.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-kelo-ink dark:text-white truncate">{invite.email}</div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold mt-0.5 ${getRoleBadgeClass(invite.role || 'member')}`}>
                      {getRoleIcon(invite.role || 'member')}
                      {(invite.role || 'member').charAt(0).toUpperCase() + (invite.role || 'member').slice(1)}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                  isDark
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-orange-50 text-orange-600 border border-orange-200'
                }`}>
                  {/* Clock mini icon */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Pending
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
