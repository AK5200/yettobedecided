'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ActivityChartProps {
  orgId: string
  days?: number
  boardId?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.name}:</span>
            <span className="text-sm font-semibold text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
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
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="h-80 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Activity Over Time</h3>
          <p className="text-sm text-gray-500">Track posts, votes, and comments</p>
        </div>
        <div className="p-3 bg-indigo-100 rounded-xl">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
            style={{ fontSize: '11px', fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            style={{ fontSize: '11px', fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm font-medium text-gray-700">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="posts"
            stroke="#6366f1"
            strokeWidth={3}
            fill="url(#colorPosts)"
            name="Posts"
            dot={false}
            activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="votes"
            stroke="#8b5cf6"
            strokeWidth={3}
            fill="url(#colorVotes)"
            name="Votes"
            dot={false}
            activeDot={{ r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="comments"
            stroke="#10b981"
            strokeWidth={3}
            fill="url(#colorComments)"
            name="Comments"
            dot={false}
            activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
