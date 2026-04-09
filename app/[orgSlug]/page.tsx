import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}): Promise<Metadata> {
  const { orgSlug } = await params
  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', orgSlug)
    .single()

  const name = org?.name || orgSlug
  return {
    title: `${name} - Feedback`,
    description: `View feedback boards and feature requests for ${name}.`,
  }
}

export default async function PublicOrgPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .single()

  if (!org) {
    notFound()
  }

  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('org_id', org.id)
    .eq('is_public', true)

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] transition-colors duration-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-kelo-border dark:border-white/8">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="w-8 h-8 rounded-lg object-contain ring-1 ring-kelo-border dark:ring-white/10 bg-kelo-surface dark:bg-white/[0.04] p-0.5"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-kelo-yellow flex items-center justify-center text-sm font-display font-extrabold text-kelo-ink">
                {org.name?.charAt(0) || 'K'}
              </div>
            )}
            <span className="font-display font-bold text-kelo-ink dark:text-white text-base tracking-tight">{org.name}</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href={`/${orgSlug}/features`}
              className="px-3 py-1.5 text-sm font-medium text-kelo-muted dark:text-white/50 hover:text-kelo-ink dark:hover:text-white rounded-lg hover:bg-kelo-surface dark:hover:bg-white/8 transition-all duration-150"
            >
              Features
            </Link>
            <Link
              href={`/${orgSlug}/roadmap`}
              className="px-3 py-1.5 text-sm font-medium text-kelo-muted dark:text-white/50 hover:text-kelo-ink dark:hover:text-white rounded-lg hover:bg-kelo-surface dark:hover:bg-white/8 transition-all duration-150"
            >
              Roadmap
            </Link>
            <Link
              href={`/${orgSlug}/changelog`}
              className="px-3 py-1.5 text-sm font-medium text-kelo-muted dark:text-white/50 hover:text-kelo-ink dark:hover:text-white rounded-lg hover:bg-kelo-surface dark:hover:bg-white/8 transition-all duration-150"
            >
              Changelog
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-display font-extrabold text-kelo-ink dark:text-white tracking-tight mb-2">
            Feedback Boards
          </h1>
          {org.description && (
            <p className="text-base text-kelo-muted dark:text-white/50 leading-relaxed">{org.description}</p>
          )}
        </div>

        {boards && boards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/${orgSlug}/${board.slug}`}
                className="group p-5 rounded-2xl border border-kelo-border dark:border-white/10 bg-white dark:bg-[#111111] hover:border-kelo-border-dark dark:hover:border-white/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-200"
              >
                <h3 className="text-base font-semibold text-kelo-ink dark:text-white mb-1.5 group-hover:text-kelo-yellow-dark dark:group-hover:text-kelo-yellow transition-colors">
                  {board.name}
                </h3>
                <p className="text-sm text-kelo-muted dark:text-white/40 leading-relaxed line-clamp-2">
                  {board.description || 'No description'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-kelo-muted dark:text-white/40 text-sm">No public boards yet.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      {org.show_branding && (
        <footer className="border-t border-kelo-border dark:border-white/8 py-6">
          <p className="text-center text-xs text-kelo-muted dark:text-white/30">
            Powered by <a href="https://kelohq.com" className="font-semibold hover:text-kelo-yellow transition-colors">Kelo</a>
          </p>
        </footer>
      )}
    </div>
  )
}
