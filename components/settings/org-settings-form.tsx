'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

interface OrgSettingsFormProps {
  orgId: string
  userRole: string
  initialValues: {
    name: string
    slug: string
    description: string
    website: string
    logoUrl: string
    plan: string
    createdAt: string
  }
}

export function OrgSettingsForm({ orgId, userRole, initialValues }: OrgSettingsFormProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()

  const [name, setName] = useState(initialValues.name)
  const [slug, setSlug] = useState(initialValues.slug)
  const [description, setDescription] = useState(initialValues.description)
  const [website, setWebsite] = useState(initialValues.website)
  const [logoUrl, setLogoUrl] = useState(initialValues.logoUrl)
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const hasChanges =
    name !== initialValues.name ||
    slug !== initialValues.slug ||
    description !== initialValues.description ||
    website !== initialValues.website ||
    logoUrl !== initialValues.logoUrl

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const response = await fetch(`/api/organizations/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, description, website, logo_url: logoUrl }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || 'Failed to update organization.')
    } else {
      toast.success('Organization updated!')
      router.refresh()
    }

    setLoading(false)
  }

  const planConfig: Record<string, { label: string; color: string; bg: string; darkBg: string; darkText: string }> = {
    free: { label: 'Free', color: 'text-kelo-muted', bg: 'bg-gray-100', darkBg: 'bg-white/[0.06]', darkText: 'text-white/40' },
    pro: { label: 'Pro', color: 'text-kelo-yellow-dark', bg: 'bg-kelo-yellow-light', darkBg: 'bg-kelo-yellow/10', darkText: 'text-kelo-yellow' },
    team: { label: 'Team', color: 'text-indigo-600', bg: 'bg-indigo-50', darkBg: 'bg-indigo-500/10', darkText: 'text-indigo-400' },
  }
  const plan = planConfig[initialValues.plan] || planConfig.free

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className={`inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold tracking-widest uppercase ${
          isDark ? 'border-white/10 bg-white/5 text-white/40' : 'border-kelo-border bg-kelo-surface text-kelo-muted'
        }`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
          Organization
        </div>
        <h1 className={`text-3xl md:text-4xl font-display font-extrabold tracking-tight leading-tight mb-2 ${isDark ? 'text-white' : 'text-kelo-ink'}`}>
          Organization settings
        </h1>
        <p className={`text-base ${isDark ? 'text-white/50' : 'text-kelo-muted'}`}>
          Manage your organization&apos;s profile and public identity.
        </p>
      </div>

      {/* Overview card */}
      <div className={`rounded-2xl border p-5 mb-6 ${isDark ? 'bg-[#111111] border-white/[0.07]' : 'bg-white border-kelo-border'}`}>
        <div className="flex items-center gap-4">
          {/* Logo or fallback */}
          {logoUrl && !logoError ? (
            <img
              src={logoUrl}
              alt={name}
              className="w-14 h-14 rounded-2xl object-contain ring-1 ring-kelo-border dark:ring-white/10 bg-kelo-surface dark:bg-white/[0.04] p-1"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-display font-extrabold ${isDark ? 'bg-kelo-yellow/10 text-kelo-yellow' : 'bg-kelo-yellow-light text-kelo-yellow-dark'}`}>
              {(name || 'O')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className={`text-lg font-display font-bold truncate ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{name || 'Your Organization'}</div>
            <div className={`text-sm ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
              kelohq.com/{slug || '...'}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isDark ? `${plan.darkBg} ${plan.darkText}` : `${plan.bg} ${plan.color}`}`}>
              {plan.label} plan
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${isDark ? 'bg-white/[0.06] text-white/40' : 'bg-kelo-surface text-kelo-muted'}`}>
              {userRole}
            </span>
          </div>
        </div>
        {initialValues.createdAt && (
          <div className={`mt-3 pt-3 border-t text-xs ${isDark ? 'border-white/[0.05] text-white/20' : 'border-kelo-border text-kelo-muted/60'}`}>
            Created {new Date(initialValues.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Information */}
        <SettingsCard
          isDark={isDark}
          icon={
            <svg className="w-4 h-4" style={{ color: '#F5C518' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
          iconAccent="#F5C518"
          title="Basic Information"
          description="Your organization's public profile details."
        >
          <div className="space-y-4">
            <FormField label="Organization Name" isDark={isDark}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
                required
                className={inputClasses(isDark)}
              />
            </FormField>

            <FormField label="URL Slug" hint="This is used in your public feedback hub URL." isDark={isDark}>
              <div className="flex items-center">
                <span className={`inline-flex items-center h-11 px-3.5 rounded-l-xl border border-r-0 text-sm font-medium select-none ${
                  isDark ? 'bg-white/[0.04] border-white/[0.08] text-white/30' : 'bg-kelo-surface border-kelo-border text-kelo-muted'
                }`}>
                  kelohq.com/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme"
                  required
                  className={`${inputClasses(isDark)} rounded-l-none border-l-0`}
                />
              </div>
            </FormField>
          </div>
        </SettingsCard>

        {/* Description */}
        <SettingsCard
          isDark={isDark}
          icon={
            <svg className="w-4 h-4" style={{ color: '#6366F1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
          iconAccent="#6366F1"
          title="Description"
          description="Tell users what your organization does."
        >
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of your organization..."
            rows={4}
            className={`${inputClasses(isDark)} resize-none min-h-[100px]`}
          />
        </SettingsCard>

        {/* Website & Branding */}
        <SettingsCard
          isDark={isDark}
          icon={
            <svg className="w-4 h-4" style={{ color: '#22C55E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          }
          iconAccent="#22C55E"
          title="Website & Branding"
          description="Links and visual identity for your organization."
        >
          <div className="space-y-4">
            <FormField label="Website URL" isDark={isDark}>
              <div className="relative">
                <svg className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/20' : 'text-kelo-muted/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 006.364 6.364l4.5-4.5z" />
                </svg>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://acme.com"
                  className={`${inputClasses(isDark)} pl-10`}
                />
              </div>
            </FormField>

            <FormField label="Logo URL" isDark={isDark}>
              <div className="relative">
                <svg className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/20' : 'text-kelo-muted/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25h-15A2.25 2.25 0 012.25 18z" />
                </svg>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => { setLogoUrl(e.target.value); setLogoError(false) }}
                  placeholder="https://acme.com/logo.png"
                  className={`${inputClasses(isDark)} pl-10`}
                />
              </div>
            </FormField>

            {/* Logo preview */}
            {logoUrl && (
              <div className={`rounded-xl border-2 border-dashed p-6 flex items-center justify-center ${
                isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-kelo-border bg-kelo-surface/30'
              }`}>
                {logoError ? (
                  <div className={`text-xs font-medium ${isDark ? 'text-white/30' : 'text-kelo-muted'}`}>
                    Could not load logo preview
                  </div>
                ) : (
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-16 w-auto object-contain"
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
            )}
          </div>
        </SettingsCard>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {hasChanges && (
            <span className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-kelo-yellow' : 'text-kelo-yellow-dark'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-kelo-yellow animate-pulse" />
              Unsaved changes
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                hasChanges
                  ? 'bg-kelo-yellow text-kelo-ink hover:bg-kelo-yellow-dark shadow-sm hover:shadow-[0_0_20px_rgba(245,197,24,0.4)]'
                  : (isDark ? 'bg-white/[0.06] text-white/30' : 'bg-kelo-surface text-kelo-muted')
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-kelo-ink border-t-transparent animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Danger Zone — owner only */}
      {userRole === 'owner' && (
        <div className={`mt-8 rounded-2xl border p-6 ${isDark ? 'bg-[#111111] border-red-500/20' : 'bg-white border-red-200'}`}>
          <div className="flex items-start gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/10">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>Danger Zone</h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>Irreversible actions that affect your entire organization.</p>
            </div>
          </div>

          <div className={`rounded-xl border p-4 ${isDark ? 'border-red-500/10 bg-red-500/[0.03]' : 'border-red-100 bg-red-50/30'}`}>
            <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-kelo-ink'}`}>Delete this organization</h4>
            <p className={`text-xs mb-4 ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>
              This will permanently delete <strong className={isDark ? 'text-white/70' : 'text-kelo-ink'}>{initialValues.name}</strong> and all of its data including boards, posts, comments, votes, changelogs, and team members. This action cannot be undone.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold tracking-wide ${isDark ? 'text-white/60' : 'text-kelo-ink'}`}>
                  Type <strong className={isDark ? 'text-red-400' : 'text-red-600'}>{initialValues.name}</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={initialValues.name}
                  className={`${inputClasses(isDark)} !border-red-300 dark:!border-red-500/20 focus:!border-red-400 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.1)]`}
                />
              </div>

              <button
                type="button"
                disabled={deleteConfirm !== initialValues.name || deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true)
                  try {
                    const res = await fetch(`/api/organizations/${orgId}`, {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ confirmName: deleteConfirm }),
                    })
                    if (!res.ok) {
                      const data = await res.json()
                      toast.error(data.error || 'Failed to delete organization.')
                      setDeleteLoading(false)
                      return
                    }
                    toast.success('Organization deleted.')
                    // Clear org cookie and redirect
                    document.cookie = 'kelo_current_org=; path=/; max-age=0'
                    window.location.href = '/'
                  } catch {
                    toast.error('Something went wrong.')
                    setDeleteLoading(false)
                  }
                }}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                  deleteConfirm === initialValues.name
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                    : (isDark ? 'bg-white/[0.06] text-white/30' : 'bg-gray-100 text-gray-400')
                }`}
              >
                {deleteLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  'Delete this organization'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SettingsCard({ isDark, icon, iconAccent, title, description, children }: {
  isDark: boolean; icon: React.ReactNode; iconAccent: string; title: string; description: string; children: React.ReactNode
}) {
  return (
    <div className={`rounded-2xl border p-6 transition-all duration-200 ${
      isDark ? 'bg-[#111111] border-white/[0.07] hover:border-white/[0.12]' : 'bg-white border-kelo-border hover:border-kelo-border-dark hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]'
    }`}>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${iconAccent}18` }}>
          {icon}
        </div>
        <div>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-kelo-ink'}`}>{title}</h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-kelo-muted'}`}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function FormField({ label, hint, isDark, children }: {
  label: string; hint?: string; isDark: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className={`text-xs font-semibold tracking-wide ${isDark ? 'text-white/60' : 'text-kelo-ink'}`}>
        {label}
      </label>
      {children}
      {hint && (
        <p className={`text-[11px] ${isDark ? 'text-white/20' : 'text-kelo-muted/60'}`}>{hint}</p>
      )}
    </div>
  )
}

function inputClasses(isDark: boolean): string {
  return `w-full h-11 px-4 rounded-xl text-sm font-medium border outline-none transition-all duration-200 ${
    isDark
      ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-white/20 focus:border-kelo-yellow/40 focus:bg-white/[0.06]'
      : 'bg-kelo-surface border-kelo-border text-kelo-ink placeholder-kelo-muted/50 focus:border-kelo-yellow/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,197,24,0.1)]'
  }`
}
