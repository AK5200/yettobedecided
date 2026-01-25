import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function ChangelogPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user!.id)
    .single()

  const { data: entries } = await supabase
    .from('changelog_entries')
    .select('*')
    .eq('org_id', membership?.org_id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Changelog</h1>
        <Link href="/changelog/new">
          <Button>New Entry</Button>
        </Link>
      </div>
      {!entries || entries.length === 0 ? (
        <p>No changelog entries yet.</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const preview = entry.content ? entry.content.slice(0, 160) : ''
            return (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle>{entry.title}</CardTitle>
                    <Badge variant="secondary" className="capitalize">
                      {entry.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {preview || 'No content'}
                  </p>
                  <div className="mt-4">
                    <Badge variant={entry.is_published ? 'default' : 'outline'}>
                      {entry.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
