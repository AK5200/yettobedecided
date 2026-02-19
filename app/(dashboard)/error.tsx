'use client'

import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-gray-600">We couldn't load this page. Please try again.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
