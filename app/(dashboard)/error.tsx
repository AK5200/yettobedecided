'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center flex-col gap-4 p-6 text-center">
      <div className="flex flex-col items-center gap-3 max-w-md">
        <h2 className="text-xl font-semibold text-gray-900">Page error</h2>
        <p className="text-sm text-gray-500">
          This page encountered an error. Try refreshing, or contact support if it keeps happening.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 mt-2">
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
