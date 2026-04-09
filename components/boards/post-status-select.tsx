'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface StatusDef {
  key: string
  name: string
  color: string
}

interface PostStatusSelectProps {
  postId: string
  currentStatus: string
  onStatusChange: (status: string) => void
  statuses: StatusDef[]
}

export function PostStatusSelect({
  currentStatus,
  onStatusChange,
  statuses,
}: PostStatusSelectProps) {
  return (
    <Select value={currentStatus} onValueChange={onStatusChange}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
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
