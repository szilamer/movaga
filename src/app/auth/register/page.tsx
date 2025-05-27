'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    referrerId: '', // Opcionális meghívókód
  })
  const [error, setError] = useState('')

  // URL paraméterből meghívó kód beállítása
  useEffect(() => {
    const refParam = searchParams.get('ref')
    if (refParam) {
      setFormData(prev => ({ ...prev, referrerId: refParam }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Hiba történt a regisztráció során')
      }

      // Átirányítás a bejelentkezési oldalra
      router.push('/auth/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gold">
            Regisztráció
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Név
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white rounded-t-md focus:outline-none focus:ring-gold focus:border-gold focus:z-10 sm:text-sm bg-gray-700"
                placeholder="Teljes név"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email cím
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-gold focus:border-gold focus:z-10 sm:text-sm bg-gray-700"
                placeholder="Email cím"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Jelszó
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-gold focus:border-gold focus:z-10 sm:text-sm bg-gray-700"
                placeholder="Jelszó"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="referrerId" className="sr-only">
                Meghívókód
              </label>
              <input
                id="referrerId"
                name="referrerId"
                type="text"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white rounded-b-md focus:outline-none focus:ring-gold focus:border-gold focus:z-10 sm:text-sm bg-gray-700"
                placeholder="Meghívókód (opcionális)"
                value={formData.referrerId}
                onChange={(e) =>
                  setFormData({ ...formData, referrerId: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-gold hover:bg-gold/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold"
            >
              Regisztráció
            </button>
          </div>

          <div className="text-sm text-center">
            <Link
              href="/auth/login"
              className="font-medium text-gold hover:text-gold/90"
            >
              Már van fiókod? Jelentkezz be!
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 
