'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface StatusDef {
  key: string
  name: string
  color: string
}

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
  statuses: StatusDef[]
}

export function StatusFilter({ value, onChange, statuses }: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        {statuses.map((status) => (
          <SelectItem key={status.key} value={status.key}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
              {status.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
