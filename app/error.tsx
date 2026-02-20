'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <div className="flex min-h-screen items-center justify-center flex-col gap-4 p-6 text-center">
      <div className="flex flex-col items-center gap-3 max-w-md">
        <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
        <p className="text-sm text-gray-500">
          An unexpected error occurred. Please try again, or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
