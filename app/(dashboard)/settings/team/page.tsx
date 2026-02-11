import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InviteMemberForm } from '@/components/settings/invite-member-form'
import { TeamMembersList } from '@/components/settings/team-members-list'

export default async function TeamSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  const orgId = membership?.org_id

  const { data: members } = await supabase.from('org_members').select('*').eq('org_id', orgId)

  // Enrich members with email/name from auth.users via admin client
  const enrichedMembers = members || []
  if (enrichedMembers.length > 0) {
    const adminClient = createAdminClient()
    const userIds = enrichedMembers.map((m: any) => m.user_id)
    const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 100 })
    const authUsers = authData?.users || []

    enrichedMembers.forEach((member: any) => {
      const authUser = authUsers.find((u: any) => u.id === member.user_id)
      if (authUser) {
        member.email = authUser.email
        member.name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || null
      }
    })
  }

  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('org_id', orgId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Team</h1>
      <p className="text-gray-500 mb-8">
        Manage your team members and their roles.
      </p>
      <div className="space-y-6">
        <InviteMemberForm orgId={orgId} />
        <TeamMembersList members={enrichedMembers} invitations={invitations || []} orgId={orgId} />
      </div>
    </div>
  )
}
