'use client'

import { SessionProvider } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Toaster />
    </SessionProvider>
  )
} 
