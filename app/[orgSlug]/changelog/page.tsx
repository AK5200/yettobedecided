import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ChangelogSubscribeForm } from '@/components/changelog/changelog-subscribe-form'
import Link from 'next/link'

export default async function PublicChangelogPage({
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

  const { data: entries } = await supabase
    .from('changelog_entries')
    .select('*')
    .eq('org_id', org.id)
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen p-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 mb-8">
        <nav className="flex gap-4 text-sm">
          <Link href={`/${orgSlug}/features`} className="text-muted-foreground">
            Features
          </Link>
          <Link href={`/${orgSlug}/roadmap`} className="text-muted-foreground">
            Roadmap
          </Link>
          <Link href={`/${orgSlug}/changelog`} className="font-medium">
            Changelog
          </Link>
        </nav>
      </header>
      <h2 className="text-xl font-semibold mb-6">Changelog</h2>
      <div className="mb-8 space-y-2">
        <h3 className="text-lg font-semibold">Subscribe for updates</h3>
        <ChangelogSubscribeForm orgId={org.id} />
      </div>
      <div className="space-y-6">
        {entries?.map((entry) => (
          <div key={entry.id} className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {entry.published_at
                ? new Date(entry.published_at).toLocaleDateString()
                : ''}
            </div>
            <Badge variant="secondary" className="capitalize">
              {entry.category}
            </Badge>
            <h3 className="text-lg font-semibold">{entry.title}</h3>
            <p className="text-muted-foreground">{entry.content}</p>
          </div>
        ))}
      </div>
      {org.show_branding ? (
        <div className="mt-12 text-sm text-muted-foreground">Powered by FeedbackHub</div>
      ) : null}
    </div>
  )
}
