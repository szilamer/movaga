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
} from '@heroicons/react/24/outline'

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

  return (
    <nav className="flex space-x-4 border-b border-gray-200 bg-white px-4 py-3">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={clsx(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
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
  )
}

export default AdminNav 
