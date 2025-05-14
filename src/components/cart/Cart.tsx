'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    stock: number
    category: {
      id: string
      name: string
    }
  }
}

interface CartData {
  items: CartItem[]
  total: number
}

export default function Cart() {
  const { data: session } = useSession()
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart')
      if (!response.ok) {
        throw new Error('Hiba történt a kosár betöltése közben')
      }
      const data = await response.json()
      setCart(data)
      setError(null)
    } catch (err) {
      setError('Nem sikerült betölteni a kosarat')
      console.error('Hiba:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchCart()
    }
  }, [session])

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: itemId, quantity }),
      })

      if (!response.ok) {
        throw new Error('Hiba történt a mennyiség frissítése közben')
      }

      await fetchCart()
    } catch (err) {
      setError('Nem sikerült frissíteni a mennyiséget')
      console.error('Hiba:', err)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart?id=${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Hiba történt a tétel törlése közben')
      }

      await fetchCart()
    } catch (err) {
      setError('Nem sikerült törölni a tételt')
      console.error('Hiba:', err)
    }
  }

  if (!session) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4">A kosár megtekintéséhez be kell jelentkezned.</p>
        <Link
          href="/auth/signin"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Bejelentkezés
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p>Betöltés...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>A kosarad üres.</p>
        <Link
          href="/products"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Vásárlás folytatása
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 bg-white inline-block px-3 py-1 rounded text-black">Kosár</h1>
      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border p-4 rounded bg-white text-black"
          >
            <div className="flex-1">
              <h3 className="font-semibold">{item.product.name}</h3>
              <p className="text-gray-600">
                Kategória: {item.product.category.name}
              </p>
              <p className="text-gray-600">
                Ár: {item.product.price.toLocaleString('hu-HU')} Ft
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    updateQuantity(item.id, Math.max(1, item.quantity - 1))
                  }
                  className="px-2 py-1 bg-gray-200 rounded text-black"
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(
                      item.id,
                      Math.min(item.product.stock, item.quantity + 1)
                    )
                  }
                  className="px-2 py-1 bg-gray-200 rounded text-black"
                  disabled={item.quantity >= item.product.stock}
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-600 hover:text-red-800"
              >
                Törlés
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-right">
        <p className="text-xl font-bold bg-white inline-block px-3 py-1 rounded text-black">
          Összesen: {cart.total.toLocaleString('hu-HU')} Ft
        </p>
      </div>
      <div className="mt-4 flex justify-between">
        <Link
          href="/products"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Vásárlás folytatása
        </Link>
        <Link
          href="/checkout"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Tovább a pénztárhoz
        </Link>
      </div>
    </div>
  )
} 
