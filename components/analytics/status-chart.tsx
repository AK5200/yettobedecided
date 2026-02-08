'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

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
          const chartData = Object.entries(byStatus).map(([status, count]) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
            value: count,
            status,
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {total > 0 && (
        <div className="text-center mt-4">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500">Total Posts</div>
        </div>
      )}
    </div>
  )
}
