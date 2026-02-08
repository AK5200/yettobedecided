'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
      <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
        <option>Loading...</option>
      </select>
    )
  }

  return (
    <select
      value={currentBoardId}
      onChange={handleChange}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
    >
      <option value="">All Boards</option>
      {boards.map((board) => (
        <option key={board.id} value={board.id}>
          {board.name}
        </option>
      ))}
    </select>
  )
}
