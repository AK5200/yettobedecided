'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
}

const STATUSES = ['all', 'open', 'planned', 'in_progress', 'shipped', 'closed']

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
