'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PostStatusSelectProps {
  postId: string
  currentStatus: string
  onStatusChange: (status: string) => void
}

const statuses = ['open', 'planned', 'in_progress', 'shipped', 'closed']

export function PostStatusSelect({
  currentStatus,
  onStatusChange,
}: PostStatusSelectProps) {
  return (
    <Select value={currentStatus} onValueChange={onStatusChange}>
      <SelectTrigger className="w-32">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status} value={status}>
            {status.replace('_', ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
