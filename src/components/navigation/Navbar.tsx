'use client'

import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import UserMenu from './UserMenu'
import MobileMenu from './MobileMenu'

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const user = session?.user ? {
    ...session.user,
    role: session.user.role || 'USER'
  } : null

  return (
    <nav className="bg-black text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo és főmenü */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-gold">
                MOVAGA
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/products"
                className="inline-flex items-center px-1 pt-1 text-white hover:text-gold"
              >
                Termékek
              </Link>
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-1 pt-1 text-white hover:text-gold"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/network"
                    className="inline-flex items-center px-1 pt-1 text-white hover:text-gold"
                  >
                    Hálózat
                  </Link>
                  {(user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
                    <Link
                      href="/admin/products"
                      className="inline-flex items-center px-1 pt-1 text-white hover:text-gold"
                    >
                      Termékek kezelése
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Jobb oldali menü */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <UserMenu user={user} onLogout={() => signOut()} />
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-4 py-2 border border-gold text-sm font-medium rounded-md text-gold bg-black hover:bg-gray-800"
                >
                  Bejelentkezés
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-gold hover:bg-gold/90"
                >
                  Regisztráció
                </Link>
              </div>
            )}
          </div>

          {/* Mobil menü gomb */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Menü megnyitása</span>
              {isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobil menü */}
      <MobileMenu isOpen={isMobileMenuOpen} user={user} onLogout={() => signOut()} />
    </nav>
  )
} 
