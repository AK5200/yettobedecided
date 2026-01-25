import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const action = actionLabel ? (
    actionHref ? (
      <Link href={actionHref}>
        <Button>{actionLabel}</Button>
      </Link>
    ) : (
      <Button onClick={onAction}>{actionLabel}</Button>
    )
  ) : null

  return (
    <div className="border rounded-lg p-8 text-center space-y-3">
      {icon && <div className="flex justify-center">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-gray-600">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
