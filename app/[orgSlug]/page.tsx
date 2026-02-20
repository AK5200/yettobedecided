import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="min-h-screen p-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 mb-8">
        <nav className="flex gap-4 text-sm">
          <Link href={`/${orgSlug}/features`} className="font-medium">
            Features
          </Link>
          <Link href={`/${orgSlug}/roadmap`} className="text-muted-foreground">
            Roadmap
          </Link>
          <Link href={`/${orgSlug}/changelog`} className="text-muted-foreground">
            Changelog
          </Link>
        </nav>
      </header>
      <h2 className="text-xl font-semibold mb-4">Feedback Boards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards?.map((board) => (
          <Link key={board.id} href={`/${orgSlug}/${board.slug}`}>
            <Card>
              <CardHeader>
                <CardTitle>{board.name}</CardTitle>
              </CardHeader>
              <CardContent>{board.description || 'No description'}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {org.show_branding ? (
        <div className="mt-12 text-sm text-muted-foreground">Powered by Kelo</div>
      ) : null}
    </div>
  )
}
