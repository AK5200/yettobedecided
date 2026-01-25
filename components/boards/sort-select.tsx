'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SortSelectProps {
  value: string
  onChange: (value: string) => void
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_votes', label: 'Most Votes' },
]

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
