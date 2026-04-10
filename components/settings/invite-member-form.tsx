'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

function RoleInfoTooltip({ isDark }: { isDark: boolean }) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        type="button"
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
          isDark
            ? 'bg-white/10 text-white/40 hover:bg-white/20 hover:text-white/70'
            : 'bg-kelo-border text-kelo-muted hover:bg-kelo-ink/10 hover:text-kelo-ink'
        }`}
        aria-label="Role information"
      >
        ?
      </button>
      {open && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-4 rounded-xl border shadow-xl z-50 text-left ${
            isDark
              ? 'bg-[#111111] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              : 'bg-white border-kelo-border shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
          }`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-kelo-yellow" />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Admin</span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-kelo-muted'}`}>
                Full create, read, and write access. Can approve/reject posts and manage settings. Cannot create new organizations.
              </p>
            </div>
            <div className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-kelo-border'}`} />
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Member</span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-kelo-muted'}`}>
                Full read access. Can create posts, add comments, manage tags, and approve/reject posts in moderation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface InviteMemberFormProps {
  orgId: string
}

export function InviteMemberForm({ orgId }: InviteMemberFormProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const response = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, email, role }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to send invitation.')
    } else {
      toast.success('Invitation sent!')
      setEmail('')
      setRole('member')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className={`rounded-2xl border p-6 transition-all duration-200 ${
      isDark
        ? 'bg-[#111111] border-white/[0.07]'
        : 'bg-white border-kelo-border'
    }`}>
      <div className="flex items-start gap-4 mb-6">
        <div className="p-2.5 bg-kelo-yellow/20 rounded-xl shrink-0">
          {/* UserPlus icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kelo-yellow-dark">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <div>
          <h3 className="font-display font-extrabold text-kelo-ink dark:text-white">Invite Team Member</h3>
          <p className="text-sm text-kelo-muted dark:text-white/40 mt-0.5">Send an invitation to add someone to your team.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email field */}
          <div className="space-y-2">
            <label htmlFor="invite-email" className="flex items-center gap-2 text-sm font-semibold text-kelo-ink dark:text-white">
              {/* Mail icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kelo-muted dark:text-white/40">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Email Address
            </label>
            <input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-colors placeholder:text-kelo-muted/60 dark:placeholder:text-white/20 text-kelo-ink dark:text-white ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.08] focus:border-white/[0.16]'
                  : 'bg-kelo-surface border-kelo-border focus:border-kelo-ink/20'
              }`}
            />
          </div>

          {/* Role toggle */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-kelo-ink dark:text-white">
              {/* Shield icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kelo-muted dark:text-white/40">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              </svg>
              Role
              <RoleInfoTooltip isDark={isDark} />
            </label>
            <div className={`flex h-11 rounded-xl border p-1 ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08]'
                : 'bg-kelo-surface border-kelo-border'
            }`}>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  role === 'admin'
                    ? 'bg-kelo-yellow text-kelo-ink shadow-sm'
                    : 'text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white/70'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`flex-1 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  role === 'member'
                    ? 'bg-kelo-yellow text-kelo-ink shadow-sm'
                    : 'text-kelo-muted dark:text-white/40 hover:text-kelo-ink dark:hover:text-white/70'
                }`}
              >
                Member
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl font-semibold text-sm bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm hover:shadow-md"
          >
            {loading ? (
              <>
                {/* Spinner */}
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                {/* Send icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                  <path d="m21.854 2.147-10.94 10.939" />
                </svg>
                Send Invite
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
