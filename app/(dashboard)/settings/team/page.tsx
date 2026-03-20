import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InviteMemberForm } from '@/components/settings/invite-member-form'
import { TeamMembersList } from '@/components/settings/team-members-list'

export default async function TeamSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members').select('org_id, role').eq('user_id', user.id).limit(1).single()

  const orgId = membership?.org_id
  const currentUserRole = membership?.role as string

  const { data: members } = await supabase.from('org_members').select('*').eq('org_id', orgId)

  const enrichedMembers = members || []
  if (enrichedMembers.length > 0) {
    const adminClient = createAdminClient()
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
    .from('invitations').select('*').eq('org_id', orgId).is('accepted_at', null).order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto font-sans">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-kelo-border dark:border-white/10 bg-kelo-surface dark:bg-white/5 text-xs font-mono font-semibold text-kelo-muted dark:text-white/40 tracking-widest uppercase">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          Team
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-kelo-ink dark:text-white tracking-tight leading-tight mb-2">
          Team members
        </h1>
        <p className="text-base text-kelo-muted dark:text-white/50">
          Manage your team and their roles.
        </p>
      </div>
      <div className="space-y-5">
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <InviteMemberForm orgId={orgId} />
        )}
        <TeamMembersList members={enrichedMembers} invitations={invitations || []} orgId={orgId} currentUserRole={currentUserRole} />
      </div>
    </div>
  )
}
