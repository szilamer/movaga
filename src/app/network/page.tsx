'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import NetworkTree from '@/components/network/NetworkTree'
import ReferralLinkBox from '@/components/dashboard/ReferralLinkBox'

interface NetworkMember {
  id: string;
  name: string | null;
  email: string | null;
  monthlySales: number;
  joinedAt: Date;
  role: string;
  referralCount: number;
  children: NetworkMember[];
}

export default function NetworkPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [networkMembers, setNetworkMembers] = useState<NetworkMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchNetworkData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/users/network', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error('Hiba történt a hálózati adatok betöltése közben')
      }
      
      const data = await response.json()
      console.log('Network API response:', data)
      
      // Az új API formátum egy tömböt ad vissza egyetlen gyökér elemmel
      if (Array.isArray(data)) {
        setNetworkMembers(data)
      } else {
        // Fallback a régi formátumhoz, ha még mindig objektumot kapunk
        setNetworkMembers(data.members || [])
      }
      
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
      console.error('Hiba:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchNetworkData()
  }, [fetchNetworkData])

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    fetchNetworkData()
  }, [status, router, fetchNetworkData])

  // Automatikus frissítés 5 percenként
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchNetworkData()
      }
    }, 5 * 60 * 1000) // 5 perc

    return () => clearInterval(interval)
  }, [loading, refreshing, fetchNetworkData])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Hálózati adatok betöltése...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            disabled={refreshing}
          >
            {refreshing ? 'Frissítés...' : 'Újrapróbálás'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hálózati Tagok</h1>
            <p className="text-muted-foreground mt-2">
              A hálózatod vizuális megjelenítése és forgalmi adatok
            </p>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground mt-1">
                Utolsó frissítés: {lastUpdated.toLocaleString('hu-HU')}
              </p>
            )}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg 
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            {refreshing ? 'Frissítés...' : 'Frissítés'}
          </button>
        </div>

        {/* Meghívó kód küldése szekció */}
        <div className="mb-8">
          <ReferralLinkBox />
        </div>

        {networkMembers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Még nincsenek hálózati tagok.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6">
            <NetworkTree data={networkMembers} />
          </div>
        )}
      </div>
    </div>
  )
} 
