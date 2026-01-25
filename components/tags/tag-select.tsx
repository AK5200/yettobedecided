'use client'

import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagSelectProps {
  orgId: string
  value: string[]
  onChange: (value: string[]) => void
}

export function TagSelect({ orgId, value, onChange }: TagSelectProps) {
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    const fetchTags = async () => {
      const response = await fetch(`/api/tags?org_id=${orgId}`)
      const data = await response.json()
      setTags(data.tags || [])
    }
    if (orgId) fetchTags()
  }, [orgId])

  const toggleTag = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId))
    } else {
      onChange([...value, tagId])
    }
  }

  return (
    <div className="space-y-2">
      {tags.map((tag) => (
        <label key={tag.id} className="flex items-center gap-2 text-sm">
          <Checkbox checked={value.includes(tag.id)} onCheckedChange={() => toggleTag(tag.id)} />
          {tag.name}
        </label>
      ))}
      {tags.length === 0 && <p className="text-sm text-gray-600">No tags available.</p>}
    </div>
  )
}
