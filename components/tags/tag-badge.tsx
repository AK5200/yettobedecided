import { Badge } from '@/components/ui/badge'

interface TagBadgeProps {
  name: string
  color: string
}

export function TagBadge({ name, color }: TagBadgeProps) {
  return (
    <Badge style={{ backgroundColor: color }} className="text-white">
      {name}
    </Badge>
  )
}
