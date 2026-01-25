import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function BoardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user!.id)
    .single()

  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('org_id', membership?.org_id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Boards</h1>
        <Link href="/boards/new">
          <Button>New Board</Button>
        </Link>
      </div>
      {!boards || boards.length === 0 ? (
        <p>No boards yet. Create your first board!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Link key={board.id} href={`/boards/${board.id}`}>
              <Card>
                <CardHeader>
                  <CardTitle>{board.name}</CardTitle>
                </CardHeader>
                <CardContent>{board.description || 'No description'}</CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
