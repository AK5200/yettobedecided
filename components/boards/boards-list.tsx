'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import Link from 'next/link'
import { BoardSettingsButton } from '@/components/boards/board-settings-button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Board } from '@/lib/types/database'

interface BoardsListProps {
  activeBoards: Board[]
  archivedBoards: Board[]
}

export function BoardsList({ activeBoards, archivedBoards }: BoardsListProps) {
  const router = useRouter()
  const [loadingBoardId, setLoadingBoardId] = useState<string | null>(null)

  const handleUnarchive = async (boardId: string) => {
    setLoadingBoardId(boardId)
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: false }),
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          toast.error(errorData.error || 'Failed to unarchive board.')
        } else {
          toast.error('Failed to unarchive board.')
        }
        return
      }

      toast.success('Board unarchived.')
      router.refresh()
    } catch (error) {
      toast.error('Failed to unarchive board.')
    } finally {
      setLoadingBoardId(null)
    }
  }

  const renderBoardCard = (board: Board, showUnarchive: boolean = false) => (
    <Card key={board.id} className="relative">
      <Link href={`/boards/${board.id}`}>
        <CardHeader>
          <CardTitle>{board.name}</CardTitle>
        </CardHeader>
        <CardContent>{board.description || 'No description'}</CardContent>
      </Link>
      <BoardSettingsButton boardId={board.id} />
      {showUnarchive && (
        <div className="absolute bottom-4 right-16">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              handleUnarchive(board.id)
            }}
            disabled={loadingBoardId === board.id}
          >
            {loadingBoardId === board.id ? 'Unarchiving...' : 'Unarchive'}
          </Button>
        </div>
      )}
    </Card>
  )

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Boards</h1>
        <Link href="/boards/new">
          <Button>New Board</Button>
        </Link>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeBoards.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedBoards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {!activeBoards || activeBoards.length === 0 ? (
            <EmptyState
              title="No active boards"
              description="Create your first board to start collecting feedback."
              actionLabel="New Board"
              actionHref="/boards/new"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBoards.map((board) => renderBoardCard(board))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          {!archivedBoards || archivedBoards.length === 0 ? (
            <EmptyState
              title="No archived boards"
              description="Archived boards will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedBoards.map((board) => renderBoardCard(board, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
