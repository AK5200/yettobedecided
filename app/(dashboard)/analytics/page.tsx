'use client'

import { Suspense } from 'react'
import { AnalyticsSkeleton } from '@/components/analytics/analytics-skeleton'
import { MetricCards } from '@/components/analytics/metric-cards'
import { ActivityChart } from '@/components/analytics/activity-chart'
import { StatusChart } from '@/components/analytics/status-chart'
import { PriorityMatrix } from '@/components/analytics/priority-matrix'
import { TrendingPosts } from '@/components/analytics/trending-posts'
import { TopContributors } from '@/components/analytics/top-contributors'
import { FeedbackHealth } from '@/components/analytics/feedback-health'
import { DateRangePicker } from '@/components/analytics/date-range-picker'
import { BoardFilter } from '@/components/analytics/board-filter'
import { NeedsAttention } from '@/components/analytics/needs-attention'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AnalyticsPage() {
  const searchParams = useSearchParams()
  const days = parseInt(searchParams.get('days') || '30')
  const boardId = searchParams.get('board_id') || undefined
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrg = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (membership) {
        setOrgId(membership.org_id)
      }
    }
    fetchOrg()
  }, [])

  if (!orgId) {
    return <AnalyticsSkeleton />
  }

  return (
    <div className="flex-1 bg-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <div className="flex items-center gap-3">
            <DateRangePicker defaultDays={days} />
            <BoardFilter orgId={orgId} />
          </div>
        </div>

        <Suspense fallback={<AnalyticsSkeleton />}>
          {/* Needs Attention Banner */}
          <NeedsAttention orgId={orgId} />

          {/* Metric Cards */}
          <section className="mb-6">
            <MetricCards orgId={orgId} days={days} boardId={boardId} />
          </section>

          {/* Charts Row */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <ActivityChart orgId={orgId} days={days} boardId={boardId} />
            </div>
            <div>
              <StatusChart orgId={orgId} days={days} />
            </div>
          </section>

          {/* Prioritization Matrix */}
          <section className="mb-6">
            <PriorityMatrix orgId={orgId} boardId={boardId} />
          </section>

          {/* Bottom Row */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <TrendingPosts orgId={orgId} boardId={boardId} />
            </div>
            <div>
              <TopContributors orgId={orgId} />
            </div>
            <div>
              <FeedbackHealth orgId={orgId} />
            </div>
          </section>
        </Suspense>
      </div>
    </div>
  )
}
