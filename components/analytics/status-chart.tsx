'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'

interface StatusChartProps {
  orgId: string
  days?: number
}

const DEFAULT_STATUS_MAP: Record<string, { name: string; color: string }> = {
  open: { name: 'Open', color: '#6B7280' },
  planned: { name: 'Planned', color: '#3B82F6' },
  in_progress: { name: 'In Progress', color: '#F59E0B' },
  shipped: { name: 'Shipped', color: '#10B981' },
  closed: { name: 'Closed', color: '#EF4444' },
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-foreground mb-1">{data.name}</p>
        <p className="text-lg font-bold" style={{ color: data.payload.fill }}>
          {data.value} posts
        </p>
        <p className="text-xs text-muted-foreground mt-1">
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
          <span className="text-sm font-medium text-foreground/80">{entry.value}</span>
          <span className="text-sm text-muted-foreground">({entry.payload.value})</span>
        </div>
      ))}
    </div>
  )
}

export function StatusChart({ orgId, days = 30 }: StatusChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMap, setStatusMap] = useState<Record<string, { name: string; color: string }>>(DEFAULT_STATUS_MAP)

  useEffect(() => {
    fetch('/api/statuses').then(r => r.json()).then(d => {
      if (d.statuses) {
        const map: Record<string, { name: string; color: string }> = {}
        for (const s of d.statuses) map[s.key] = { name: s.name, color: s.color }
        setStatusMap(map)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/analytics?org_id=${orgId}&days=${days}`)
        if (res.ok) {
          const json = await res.json()
          const byStatus = json.by_status || {}
          const total = Object.values(byStatus).reduce((sum: number, count: any) => sum + count, 0)
          const chartData = Object.entries(byStatus).map(([status, count]) => ({
            name: statusMap[status]?.name || status.replace('_', ' '),
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
  }, [orgId, days, statusMap])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-border p-6">
        <div className="h-80 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1">Status Distribution</h3>
          <p className="text-sm text-muted-foreground">Breakdown by status</p>
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
                fill={statusMap[entry.status]?.color || '#6b7280'}
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
        <div className="text-center mt-4 pt-4 border-t border-border">
          <div className="text-3xl font-bold text-foreground">{total}</div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
            Total Posts
          </div>
        </div>
      )}
      <CustomLegend payload={data.map((entry, index) => ({
        value: entry.name,
        color: statusMap[entry.status]?.color || '#6b7280',
        payload: entry,
      }))} />
    </div>
  )
}
