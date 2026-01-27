'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SearchInput } from '@/components/search/search-input'
import { StatusFilter } from './status-filter'
import { SortSelect } from './sort-select'
import { TagFilter } from './tag-filter'

interface BoardFiltersProps {
  search: string
  status: string
  sort: string
  orgId: string
}

export function BoardFilters({ search, status, sort, orgId }: BoardFiltersProps) {
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
      <StatusFilter value={status} onChange={(value) => updateParam('status', value)} />
      <TagFilter orgId={orgId} />
      <SortSelect value={sort} onChange={(value) => updateParam('sort', value)} />
    </div>
  )
}
