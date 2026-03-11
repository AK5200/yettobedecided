import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicChangelogView } from '@/components/public/public-changelog-view'

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
    title: `${name} - Changelog`,
    description: `Stay up to date with the latest updates and changes from ${name}.`,
  }
}

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
    <PublicChangelogView
      org={org}
      orgSlug={orgSlug}
      entries={entries || []}
    />
  )
}
