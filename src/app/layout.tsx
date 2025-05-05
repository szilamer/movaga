import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import BackgroundProvider from '@/components/BackgroundProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MOVAGA',
  description: 'MOVAGA webshop',
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hu">
      <body className={`${inter.className} text-white min-h-screen`}>
        <Providers>
          <BackgroundProvider>
            {children}
          </BackgroundProvider>
        </Providers>
      </body>
    </html>
  )
} 
