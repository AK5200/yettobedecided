'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagFilterProps {
  orgId: string
}

export function TagFilter({ orgId }: TagFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [tags, setTags] = useState<Tag[]>([])
  const currentTag = searchParams.get('tag') || 'all'

  useEffect(() => {
    fetch(`/api/tags?org_id=${orgId}`)
      .then(res => res.json())
      .then(data => setTags(data.tags || []))
  }, [orgId])

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set('tag', value)
    } else {
      params.delete('tag')
    }
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname)
  }

  return (
    <Select value={currentTag} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All Tags" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Tags</SelectItem>
        {tags.map(tag => (
          <SelectItem key={tag.id} value={tag.id}>
            {tag.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
