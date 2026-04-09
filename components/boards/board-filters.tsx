'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SearchInput } from '@/components/search/search-input'
import { StatusFilter } from './status-filter'
import { SortSelect } from './sort-select'
import { TagFilter } from './tag-filter'

interface StatusDef {
  key: string
  name: string
  color: string
}

interface BoardFiltersProps {
  search: string
  status: string
  sort: string
  orgId: string
  statuses?: StatusDef[]
}

const FALLBACK_STATUSES: StatusDef[] = [
  { key: 'open', name: 'Open', color: '#6B7280' },
  { key: 'planned', name: 'Planned', color: '#3B82F6' },
  { key: 'in_progress', name: 'In Progress', color: '#F59E0B' },
  { key: 'shipped', name: 'Shipped', color: '#10B981' },
  { key: 'closed', name: 'Closed', color: '#EF4444' },
]

export function BoardFilters({ search, status, sort, orgId, statuses }: BoardFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <SearchInput />
      <StatusFilter value={status} onChange={(value) => updateParam('status', value)} statuses={statuses || FALLBACK_STATUSES} />
      <TagFilter orgId={orgId} />
      <SortSelect value={sort} onChange={(value) => updateParam('sort', value)} />
    </div>
  )
}
