import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentOrg } from '@/lib/org-context'
import { TagManager } from '@/components/tags/tag-manager'

export default async function TagsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgContext = await getCurrentOrg(supabase)
  if (!orgContext) {
    redirect('/onboarding')
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto font-sans">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-kelo-border dark:border-white/10 bg-kelo-surface dark:bg-white/5 text-xs font-mono font-semibold text-kelo-muted dark:text-white/40 tracking-widest uppercase">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          Tags
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-kelo-ink dark:text-white tracking-tight leading-tight mb-2">
          Manage tags
        </h1>
        <p className="text-base text-kelo-muted dark:text-white/50">
          Create and manage tags to categorize your feedback posts.
        </p>
      </div>
      <TagManager orgId={orgContext.orgId} />
    </div>
  )
}
