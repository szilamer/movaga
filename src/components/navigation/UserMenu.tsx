'use client'

import React from 'react'
import { useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string | null
  email: string
  role?: string
}

interface UserMenuProps {
  user: User
  onLogout: () => void
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center space-x-2 text-gray-700 hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center">
          {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
        </span>
        <span>{user.name || user.email}</span>
        <svg
          className={`h-5 w-5 transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Profil
          </Link>
          <Link
            href="/orders"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Rendelések
          </Link>
          {(user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
            <Link
              href="/admin"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Adminisztráció
            </Link>
          )}
          <button
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Kijelentkezés
          </button>
        </div>
      )}
    </div>
  )
} 
