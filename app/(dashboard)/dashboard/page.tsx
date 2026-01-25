import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(name)')
    .eq('user_id', user!.id)
    .single()

  const orgId = membership?.org_id
  const orgName = (membership?.organizations as any)?.name || 'Your Organization'

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Boards</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {boardCount || 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Changelog</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {changelogCount || 0}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
