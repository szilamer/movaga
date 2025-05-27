'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

interface PointItem {
  productName: string
  quantity: number
  pointValue: number
  totalPoints: number
}

interface PointsHistoryItem {
  id: string
  date: string
  type: 'personal' | 'network'
  description: string
  points: number
  items: PointItem[]
}

interface PointsData {
  personalPoints: number
  networkPoints: number
  totalPoints: number
  recentTotalPoints: number
  discountLevel: number
  discountPercent: number
  pointsHistory: PointsHistoryItem[]
  timeframe: string
}

interface PointsHistoryProps {
  userId?: string
}

export default function PointsHistory({ userId }: PointsHistoryProps) {
  const [pointsData, setPointsData] = useState<PointsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('3months')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const timeframeOptions = [
    { value: '1month', label: 'Elmúlt hónap' },
    { value: '3months', label: 'Elmúlt 3 hónap' },
    { value: '6months', label: 'Elmúlt 6 hónap' },
    { value: '1year', label: 'Elmúlt év' },
    { value: 'all', label: 'Összes' }
  ]

  useEffect(() => {
    fetchPointsData()
  }, [timeframe, userId])

  const fetchPointsData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/points?timeframe=${timeframe}`)
      if (!response.ok) {
        throw new Error('Hiba történt az adatok lekérése közben')
      }
      const data = await response.json()
      setPointsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const getDiscountLevelText = (level: number) => {
    switch (level) {
      case 0:
        return 'Nincs kedvezmény'
      case 1:
        return '1. szintű kedvezmény (15%)'
      case 2:
        return '2. szintű kedvezmény (30%)'
      default:
        return 'Ismeretlen szint'
    }
  }

  const getDiscountLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return 'text-gray-600 bg-gray-100'
      case 1:
        return 'text-orange-600 bg-orange-100'
      case 2:
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (!pointsData) {
    return null
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Jutalékpontok</h3>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {timeframeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        {/* Összesítő kártyák */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900">Személyes pontok</h4>
            <p className="text-2xl font-bold text-blue-600">{pointsData.personalPoints}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-900">Hálózati pontok</h4>
            <p className="text-2xl font-bold text-purple-600">{pointsData.networkPoints}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-900">Összes pont</h4>
            <p className="text-2xl font-bold text-green-600">{pointsData.totalPoints}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-orange-900">Elmúlt 3 hónap</h4>
            <p className="text-2xl font-bold text-orange-600">{pointsData.recentTotalPoints}</p>
          </div>
        </div>

        {/* Kedvezményszint */}
        <div className="mb-6 p-4 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Jelenlegi kedvezményszint</h4>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDiscountLevelColor(pointsData.discountLevel)}`}>
              {getDiscountLevelText(pointsData.discountLevel)}
            </span>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{pointsData.recentTotalPoints}</span> pont az elmúlt 3 hónapban
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {pointsData.recentTotalPoints < 50 && (
              <span>Még {50 - pointsData.recentTotalPoints} pont szükséges az 1. szintű kedvezményhez</span>
            )}
            {pointsData.recentTotalPoints >= 50 && pointsData.recentTotalPoints < 100 && (
              <span>Még {100 - pointsData.recentTotalPoints} pont szükséges a 2. szintű kedvezményhez</span>
            )}
            {pointsData.recentTotalPoints >= 100 && (
              <span>Elérted a legmagasabb kedvezményszintet!</span>
            )}
          </div>
        </div>

        {/* Pontok története */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Pontok története</h4>
          {pointsData.pointsHistory.length === 0 ? (
            <p className="text-gray-500 text-sm">Nincs pont történet a kiválasztott időszakban.</p>
          ) : (
            <div className="space-y-3">
              {pointsData.pointsHistory.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleExpanded(item.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.type === 'personal' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type === 'personal' ? 'Személyes' : 'Hálózati'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {format(new Date(item.date), 'yyyy.MM.dd', { locale: hu })}
                      </span>
                      <span className="text-sm text-gray-900">{item.description}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-green-600">+{item.points} pont</span>
                      <svg 
                        className={`w-4 h-4 transition-transform ${expandedItems.has(item.id) ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {expandedItems.has(item.id) && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                      <div className="space-y-2">
                        {item.items.map((product, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {product.productName} × {product.quantity}
                            </span>
                            <span className="text-gray-600">
                              {product.pointValue} pont/db = {product.totalPoints} pont
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 