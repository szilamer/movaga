'use client'

import React from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string | null
  email: string
  role?: string
}

interface MobileMenuProps {
  isOpen: boolean
  user: User | null
  onLogout: () => void
}

export default function MobileMenu({ isOpen, user, onLogout }: MobileMenuProps) {
  if (!isOpen) return null

  return (
    <div className="sm:hidden">
      <div className="pt-2 pb-3 space-y-1">
        <Link
          href="/products"
          className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
        >
          Termékek
        </Link>
        {user && (
          <>
            <Link
              href="/dashboard"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
            >
              Dashboard
            </Link>
            <Link
              href="/network"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
            >
              Hálózat
            </Link>
            <Link
              href="/profile"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
            >
              Profil
            </Link>
            <Link
              href="/orders"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
            >
              Rendelések
            </Link>
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
              >
                Admin felület
              </Link>
            )}
            <button
              onClick={onLogout}
              className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
            >
              Kijelentkezés
            </button>
          </>
        )}
        {!user && (
          <>
            <Link
              href="/auth/login"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
            >
              Bejelentkezés
            </Link>
            <Link
              href="/auth/register"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
            >
              Regisztráció
            </Link>
          </>
        )}
      </div>
    </div>
  )
} 