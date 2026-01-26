import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { Settings } from 'lucide-react'

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
        <EmptyState
          title="No boards yet"
          description="Create your first board to start collecting feedback."
          actionLabel="New Board"
          actionHref="/boards/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Card key={board.id} className="relative">
              <Link href={`/boards/${board.id}`}>
                <CardHeader>
                  <CardTitle>{board.name}</CardTitle>
                </CardHeader>
                <CardContent>{board.description || 'No description'}</CardContent>
              </Link>
              <Link 
                href={`/boards/${board.id}/settings`}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <Settings className="h-4 w-4 text-gray-600" />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
