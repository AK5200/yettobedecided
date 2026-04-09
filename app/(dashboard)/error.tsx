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
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 mb-2">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-display font-bold text-kelo-ink dark:text-white">Page error</h2>
        <p className="text-sm text-kelo-muted dark:text-white/50">
          This page encountered an error. Try refreshing, or contact support if it keeps happening.
        </p>
        {error.digest && (
          <p className="text-xs text-kelo-muted/60 dark:text-white/20 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 mt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-kelo-yellow text-kelo-ink text-sm font-semibold rounded-xl hover:bg-kelo-yellow-dark transition-all duration-200 shadow-sm"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 border border-kelo-border dark:border-white/10 text-kelo-ink dark:text-white text-sm font-medium rounded-xl hover:bg-kelo-surface dark:hover:bg-white/5 transition-colors"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
