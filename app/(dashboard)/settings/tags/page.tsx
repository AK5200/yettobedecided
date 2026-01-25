import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TagManager } from '@/components/tags/tag-manager'

export default async function TagsSettingsPage() {
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
    .single()

  const orgId = membership?.org_id

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Tags</h1>
      <TagManager orgId={orgId} />
    </div>
  )
}
