'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchNetworkMembers = async () => {
      try {
        const response = await fetch('/api/users/network')
        if (!response.ok) {
          throw new Error('Hiba történt a hálózati tagok lekérése közben')
        }
        const data = await response.json()
        setNetworkMembers(data.members)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchNetworkMembers()
    }
  }, [session])

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
      <h1 className="text-3xl font-bold mb-6">Hálózatom</h1>
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
        <h2 className="text-xl font-semibold mb-4">Hálózati struktúra</h2>
        {networkMembers.length > 0 ? (
          <NetworkTree data={networkMembers} />
        ) : (
          <p className="text-gray-500">Még nincsenek hálózati tagok.</p>
        )}
      </div>
    </div>
  )
} 
