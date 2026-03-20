'use client'

import { Suspense } from 'react'
import { KeloDashboard } from '@/components/analytics/kelo-dashboard'

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-kelo-surface dark:bg-[#0a0a0a] animate-pulse" />}>
      <KeloDashboard />
    </Suspense>
  )
}
