'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SalesData {
  date: string
  amount: number
}

interface SalesChartProps {
  data: SalesData[]
}

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Havi forgalom</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString('hu-HU')}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('hu-HU', {
                  style: 'currency',
                  currency: 'HUF',
                  maximumFractionDigits: 0,
                }).format(value)
              }
            />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('hu-HU', {
                  style: 'currency',
                  currency: 'HUF',
                  maximumFractionDigits: 0,
                }).format(value)
              }
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString('hu-HU')
              }
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 
