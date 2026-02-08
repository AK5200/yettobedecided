'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'

interface StatusChartProps {
  orgId: string
  days?: number
}

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  under_review: '#f59e0b',
  planned: '#8b5cf6',
  in_progress: '#f97316',
  completed: '#10b981',
  closed: '#6b7280',
}

const STATUS_NAMES: Record<string, string> = {
  open: 'Open',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 mb-1">{data.name}</p>
        <p className="text-lg font-bold" style={{ color: data.payload.fill }}>
          {data.value} posts
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {((data.value / data.payload.total) * 100).toFixed(1)}% of total
        </p>
      </div>
    )
  }
  return null
}

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-gray-700">{entry.value}</span>
          <span className="text-sm text-gray-500">({entry.payload.value})</span>
        </div>
      ))}
    </div>
  )
}

export function StatusChart({ orgId, days = 30 }: StatusChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/analytics?org_id=${orgId}&days=${days}`)
        if (res.ok) {
          const json = await res.json()
          const byStatus = json.by_status || {}
          const total = Object.values(byStatus).reduce((sum: number, count: any) => sum + count, 0)
          const chartData = Object.entries(byStatus).map(([status, count]) => ({
            name: STATUS_NAMES[status] || status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
            value: count,
            status,
            total,
          }))
          setData(chartData)
        }
      } catch (error) {
        console.error('Failed to fetch status data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchData()
    }
  }, [orgId, days])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="h-80 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Status Distribution</h3>
          <p className="text-sm text-gray-500">Breakdown by status</p>
        </div>
        <div className="p-3 bg-violet-100 rounded-xl">
          <PieChartIcon className="h-6 w-6 text-violet-600" />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.status] || '#6b7280'}
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {total > 0 && (
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{total}</div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
            Total Posts
          </div>
        </div>
      )}
      <CustomLegend payload={data.map((entry, index) => ({
        value: entry.name,
        color: STATUS_COLORS[entry.status] || '#6b7280',
        payload: entry,
      }))} />
    </div>
  )
}
