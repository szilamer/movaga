'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import SalesChart from '@/components/dashboard/SalesChart'
import NetworkStats from '@/components/dashboard/NetworkStats'
import CommissionHistory from '@/components/dashboard/CommissionHistory'
import PointsHistory from '@/components/dashboard/PointsHistory'
import ReferralLinkBox from '@/components/dashboard/ReferralLinkBox'
import OrderDetails from '@/components/orders/OrderDetails'

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Rendelések kezelése a dashboardon
  interface OrderType {
    id: string
    status: string
    createdAt: string
    total: number
    shippingMethod: string
    paymentMethod: string
    
    // Szállítási cím
    shippingFullName: string
    shippingCountry: string
    shippingCity: string
    shippingAddress: string
    shippingZipCode: string
    shippingPhone?: string
    
    // Számlázási cím
    billingFullName: string
    billingCountry: string
    billingCity: string
    billingAddress: string
    billingZipCode: string
    billingPhone?: string
    billingCompanyName?: string
    billingTaxNumber?: string
    
    items: Array<{ 
      id: string
      quantity: number
      price: number
      product: { name: string } 
    }>
  }
  const [orders, setOrders] = useState<OrderType[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/users/stats', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (!response.ok) {
        throw new Error('Hiba történt az adatok lekérése közben')
      }
      const data = await response.json()
      setDashboardData(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session, fetchDashboardData])

  // Automatikus frissítés 5 percenként
  useEffect(() => {
    if (!session) return

    const interval = setInterval(() => {
      fetchDashboardData()
    }, 5 * 60 * 1000) // 5 perc

    return () => clearInterval(interval)
  }, [session, fetchDashboardData])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/users/orders', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
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

  const handleRefresh = () => {
    fetchDashboardData()
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Üdvözlünk a vezérlőpulton!
            </h2>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  Utolsó frissítés: {lastUpdated.toLocaleTimeString('hu-HU')}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                    Frissítés...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Frissítés
                  </>
                )}
              </button>
            </div>
          </div>
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
                {dashboardData.discountLevel === 100 ? '100%' : 
                 dashboardData.discountLevel === 30 ? '2. szint (30%)' :
                 dashboardData.discountLevel === 15 ? '1. szint (15%)' :
                 'Nincs kedvezmény'}
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

        {/* Jutalékpontok szekció */}
        <PointsHistory />

        {/* Meghívó kód küldése szekció */}
        <ReferralLinkBox />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NetworkStats
            members={dashboardData.networkMembers}
            totalSales={dashboardData.totalNetworkSales}
          />
          <CommissionHistory
            commissions={dashboardData.commissionHistory}
            totalCommission={dashboardData.totalCommission}
          />
          
          {/* Rendelések lista - új OrderDetails komponenssel */}
          <div className="col-span-1 lg:col-span-2 bg-background border-border text-foreground p-6 rounded-lg shadow mt-8">
            <h3 className="text-lg font-medium mb-4">Rendeléseim és hálózati tagok rendelései</h3>
            {ordersLoading ? (
              <div className="h-12 animate-spin border-4 border-primary border-t-transparent rounded-full" />
            ) : ordersError ? (
              <p className="text-red-600">{ordersError}</p>
            ) : orders.length === 0 ? (
              <p>Nincsenek megjeleníthető rendelések.</p>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <OrderDetails 
                    key={order.id} 
                    order={order} 
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
