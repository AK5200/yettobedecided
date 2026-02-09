'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Filter } from 'lucide-react'

interface BoardFilterProps {
  orgId: string
}

interface Board {
  id: string
  name: string
}

export function BoardFilter({ orgId }: BoardFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const currentBoardId = searchParams.get('board_id') || ''

  useEffect(() => {
    const fetchBoards = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('boards')
        .select('id, name')
        .eq('org_id', orgId)
        .eq('is_archived', false)
        .order('name', { ascending: true })

      if (data) {
        setBoards(data)
      }
      setLoading(false)
    }

    if (orgId) {
      fetchBoards()
    }
  }, [orgId])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value === '') {
      params.delete('board_id')
    } else {
      params.set('board_id', e.target.value)
    }
    router.push(`/analytics?${params.toString()}`)
  }

  if (loading) {
    return (
      <select className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm cursor-wait">
        <option>Loading...</option>
      </select>
    )
  }

  return (
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
      <select
        value={currentBoardId}
        onChange={handleChange}
        className="pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm appearance-none cursor-pointer"
      >
        <option value="">All Boards</option>
        {boards.map((board) => (
          <option key={board.id} value={board.id}>
            {board.name}
          </option>
        ))}
      </select>
    </div>
  )
}
