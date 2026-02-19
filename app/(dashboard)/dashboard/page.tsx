import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MiniMetricCards } from '@/components/analytics/mini-metric-cards'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    redirect('/onboarding')
  }

  const orgId = membership.org_id
  const orgName = (membership.organizations as any)?.name || 'Your Organization'

  const { count: boardCount } = await supabase
    .from('boards')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const { count: changelogCount } = await supabase
    .from('changelog_entries')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
      <p className="text-gray-600 mb-8">{orgName}</p>

      {/* Mini Analytics Widget */}
      {orgId && <MiniMetricCards orgId={orgId} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Boards</CardTitle>
          </CardHeader>
          <CardContent>
            {boardCount ? (
              <span className="text-2xl font-bold">{boardCount}</span>
            ) : (
              <div>
                <span className="text-2xl font-bold text-gray-400">0</span>
                <p className="text-sm text-gray-500 mt-1">
                  No boards yet.{' '}
                  <Link href="/boards/new" className="text-blue-600 hover:underline font-medium">
                    Create your first board
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Changelog</CardTitle>
          </CardHeader>
          <CardContent>
            {changelogCount ? (
              <span className="text-2xl font-bold">{changelogCount}</span>
            ) : (
              <div>
                <span className="text-2xl font-bold text-gray-400">0</span>
                <p className="text-sm text-gray-500 mt-1">
                  No entries yet.{' '}
                  <Link href="/changelog/new" className="text-blue-600 hover:underline font-medium">
                    Write your first changelog
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
