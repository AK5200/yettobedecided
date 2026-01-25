'use client'

import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BoardPostsList } from './board-posts-list'
import { KanbanBoard } from './kanban-board'
import type { Post } from '@/lib/types/database'

interface BoardDetailTabsProps {
  boardId: string
  pendingPosts: Post[]
  approvedPosts: Post[]
  allPosts: Post[]
  adminEmail: string
}

export function BoardDetailTabs({
  boardId,
  pendingPosts,
  approvedPosts,
  allPosts,
  adminEmail,
}: BoardDetailTabsProps) {
  const router = useRouter()

  const handleStatusChange = async (postId: string, newStatus: string) => {
    await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
  }

  return (
    <Tabs defaultValue="list">
      <TabsList>
        <TabsTrigger value="list">List View</TabsTrigger>
        <TabsTrigger value="kanban">Kanban View</TabsTrigger>
      </TabsList>
      <TabsContent value="list" className="mt-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Pending Approval ({pendingPosts.length})
          </h2>
          <BoardPostsList
            boardId={boardId}
            initialPosts={pendingPosts}
            isAdmin={true}
            adminEmail={adminEmail}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Approved Posts ({approvedPosts.length})
          </h2>
          <BoardPostsList
            boardId={boardId}
            initialPosts={approvedPosts}
            isAdmin={true}
            adminEmail={adminEmail}
          />
        </div>
      </TabsContent>
      <TabsContent value="kanban" className="mt-6">
        <KanbanBoard posts={allPosts} onStatusChange={handleStatusChange} />
      </TabsContent>
    </Tabs>
  )
}
