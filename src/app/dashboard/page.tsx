'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import SalesChart from '@/components/dashboard/SalesChart'
import NetworkStats from '@/components/dashboard/NetworkStats'
import CommissionHistory from '@/components/dashboard/CommissionHistory'

interface DashboardData {
  monthlySales: number
  networkSize: number
  discountLevel: number
  commission: number
  salesHistory: Array<{
    date: string
    amount: number
  }>
  networkMembers: Array<{
    id: string
    name: string
    email: string
    monthlySales: number
    joinedAt: string
  }>
  commissionHistory: Array<{
    id: string
    amount: number
    type: 'personal' | 'network'
    createdAt: string
    description: string
  }>
  totalNetworkSales: number
  totalCommission: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Rendelések kezelése a dashboardon
  interface OrderType {
    id: string
    status: string
    createdAt: string
    total: number
    items: Array<{ id: string; quantity: number; product: { name: string } }>
  }
  const [orders, setOrders] = useState<OrderType[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/users/stats')
        if (!response.ok) {
          throw new Error('Hiba történt az adatok lekérése közben')
        }
        const data = await response.json()
        setDashboardData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchDashboardData()
    }
  }, [session])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/users/orders')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Hiba történt a rendelések lekérésekor')
        setOrders(data)
      } catch (err) {
        setOrdersError(err instanceof Error ? err.message : 'Ismeretlen hiba')
      } finally {
        setOrdersLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/users/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hiba a státusz módosításakor')
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Hiba történt')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Üdvözlünk a vezérlőpulton!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-primary p-6 rounded-lg">
              <h3 className="text-lg font-medium text-white">
                Havi forgalom
              </h3>
              <p className="mt-2 text-3xl font-semibold text-white">
                {dashboardData.monthlySales.toLocaleString('hu-HU')} Ft
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-green-900">
                Kedvezmény szint
              </h3>
              <p className="mt-2 text-3xl font-semibold text-green-600">
                {dashboardData.discountLevel}%
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-purple-900">
                Hálózat mérete
              </h3>
              <p className="mt-2 text-3xl font-semibold text-purple-600">
                {dashboardData.networkSize} fő
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Forgalom alakulása
          </h3>
          <SalesChart data={dashboardData.salesHistory} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NetworkStats
            members={dashboardData.networkMembers}
            totalSales={dashboardData.totalNetworkSales}
          />
          <CommissionHistory
            commissions={dashboardData.commissionHistory}
            totalCommission={dashboardData.totalCommission}
          />
          {/* Rendelések lista */}
          <div className="col-span-1 lg:col-span-2 bg-background border-border text-foreground p-6 rounded-lg shadow mt-8">
            <h3 className="text-lg font-medium mb-4">Rendeléseim és hálózati tagok rendelései</h3>
            {ordersLoading ? (
              <div className="h-12 animate-spin border-4 border-primary border-t-transparent rounded-full" />
            ) : ordersError ? (
              <p className="text-red-600">{ordersError}</p>
            ) : orders.length === 0 ? (
              <p>Nincsenek megjeleníthető rendelések.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Azonosító</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Dátum</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Termékek</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Összeg</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Státusz</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td className="px-4 py-2 text-sm">{order.id}</td>
                        <td className="px-4 py-2 text-sm">{new Date(order.createdAt).toLocaleString('hu-HU')}</td>
                        <td className="px-4 py-2 text-sm">
                          {order.items.map(i => `${i.product.name} x${i.quantity}`).join(', ')}
                        </td>
                        <td className="px-4 py-2 text-sm font-semibold">{order.total.toLocaleString('hu-HU')} Ft</td>
                        <td className="px-4 py-2 text-sm">
                          <select
                            value={order.status}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            className="rounded-md bg-background text-foreground border-border px-2 py-1 text-sm focus:border-primary focus:ring-primary focus:ring-offset-2"
                          >
                            <option value="PENDING">Függőben</option>
                            <option value="PROCESSING">Feldolgozás alatt</option>
                            <option value="SHIPPED">Kiszállítva</option>
                            <option value="COMPLETED">Teljesítve</option>
                            <option value="CANCELLED">Törölve</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
