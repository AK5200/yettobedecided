import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewPostForm } from '@/components/posts/new-post-form'

export default async function NewPostPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: board } = await supabase
    .from('boards')
    .select('*, organizations(*)')
    .eq('id', params.id)
    .single()

  if (!board) redirect('/boards')

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-6'>Create New Post</h1>
      <NewPostForm boardId={params.id} />
    </div>
  )
}
