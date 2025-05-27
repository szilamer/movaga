'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import NetworkTree from '@/components/network/NetworkTree'

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const fetchNetworkMembers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/users/network', {
        cache: 'no-store', // Biztosítjuk, hogy mindig friss adatokat kapjunk
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (!response.ok) {
        throw new Error('Hiba történt a hálózati tagok lekérése közben')
      }
      const data = await response.json()
      setNetworkMembers(data.members)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchNetworkMembers()
    }
  }, [session, fetchNetworkMembers])

  // Automatikus frissítés 5 percenként
  useEffect(() => {
    if (!session) return

    const interval = setInterval(() => {
      fetchNetworkMembers()
    }, 5 * 60 * 1000) // 5 perc

    return () => clearInterval(interval)
  }, [session, fetchNetworkMembers])

  const handleRefresh = () => {
    fetchNetworkMembers()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-4 border-primary border-t-transparent"></div>
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

  return (
    <div className="container mx-auto px-4 py-8 text-foreground">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Hálózatom</h1>
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
      
      <div className="rounded-lg border border-border bg-background p-6 text-foreground shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Meghívó kódom</h2>
        <div className="flex items-center gap-4">
          <code className="bg-muted/50 px-4 py-2 rounded text-foreground">{session?.user?.id}</code>
          <button 
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => {
              if (session?.user?.id) {
                navigator.clipboard.writeText(session.user.id)
              }
            }}
          >
            Másolás
          </button>
        </div>
      </div>
      
      <div className="rounded-lg border border-border bg-background p-6 text-foreground shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Hálózati struktúra</h2>
          <div className="text-sm text-gray-500">
            Automatikus frissítés 5 percenként
          </div>
        </div>
        {networkMembers.length > 0 ? (
          <NetworkTree data={networkMembers} />
        ) : (
          <p className="text-gray-500">Még nincsenek hálózati tagok.</p>
        )}
      </div>
    </div>
  )
} 
