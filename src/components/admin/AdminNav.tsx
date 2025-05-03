'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import {
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  TagIcon,
  UsersIcon,
  Cog6ToothIcon,
  PhotoIcon,
  TruckIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

const navItems = [
  {
    label: 'Áttekintés',
    href: '/admin',
    icon: HomeIcon,
  },
  {
    label: 'Rendelések',
    href: '/admin/orders',
    icon: ShoppingCartIcon,
  },
  {
    label: 'Termékkezelés',
    href: '/admin/product-management',
    icon: CubeIcon,
  },
  {
    label: 'Kategóriák',
    href: '/admin/categories',
    icon: TagIcon,
  },
  {
    label: 'Szállítási módok',
    href: '/admin/shipping-methods',
    icon: TruckIcon,
  },
  {
    label: 'Email sablonok',
    href: '/admin/email-templates',
    icon: EnvelopeIcon,
  },
  {
    label: 'Felhasználók',
    href: '/admin/users',
    icon: UsersIcon,
  },
  {
    label: 'Főoldal szerkesztése',
    href: '/admin/homepage',
    icon: PhotoIcon,
  },
  {
    label: 'Beállítások',
    href: '/admin/settings',
    icon: Cog6ToothIcon,
  },
]

const AdminNav = () => {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Mobile menu button */}
      <div className="flex md:hidden justify-between items-center px-4 py-3">
        <div className="font-bold">Admin felület</div>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden py-2 px-4 bg-white">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-2 py-2 px-3 rounded-md my-1 text-sm font-medium',
                pathname === item.href
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
              onClick={() => setMenuOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Desktop menu */}
      <nav className="hidden md:flex overflow-x-auto space-x-4 px-4 py-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap',
              pathname === item.href
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default AdminNav 
