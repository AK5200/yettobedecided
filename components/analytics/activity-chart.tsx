'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ActivityChartProps {
  orgId: string
  days?: number
  boardId?: string
}

export function ActivityChart({ orgId, days = 30, boardId }: ActivityChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({ org_id: orgId, days: String(days) })
        if (boardId) {
          params.append('board_id', boardId)
        }
        const res = await fetch(`/api/analytics/timeseries?${params.toString()}`)
        if (res.ok) {
          const json = await res.json()
          setData(json.series || [])
        }
      } catch (error) {
        console.error('Failed to fetch time series:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchData()
    }
  }, [orgId, days, boardId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Over Time</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
            style={{ fontSize: '12px' }}
          />
          <YAxis style={{ fontSize: '12px' }} />
          <Tooltip
            labelFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString()
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="posts"
            stroke="#6366f1"
            strokeWidth={2}
            name="Posts"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="votes"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Votes"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="comments"
            stroke="#6b7280"
            strokeWidth={2}
            name="Comments"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
