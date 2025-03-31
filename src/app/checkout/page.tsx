'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

const SHIPPING_METHODS = {
  GLS: { name: 'GLS házhozszállítás', price: 990 },
  FOXPOST: { name: 'Foxpost csomagpont', price: 1500 },
  PICKUP: { name: 'Személyes átvétel', price: 0 },
} as const

const PAYMENT_METHODS = {
  BARION: { name: 'Barion online fizetés', fee: 0 },
  CASH_ON_DELIVERY: { name: 'Utánvét', fee: 0 },
} as const

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { items, getTotal, clearCart } = useCart()
  const [shippingMethod, setShippingMethod] = useState<keyof typeof SHIPPING_METHODS>('GLS')
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof PAYMENT_METHODS>('BARION')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Bejelentkezés ellenőrzése
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/checkout')
    }
  }, [status, router])

  // Ha nincs bejelentkezve vagy még töltődik, loading állapotot mutatunk
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  const subtotal = getTotal()
  const shippingCost = SHIPPING_METHODS[shippingMethod].price
  const total = subtotal + shippingCost

  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          shippingMethod: SHIPPING_METHODS[shippingMethod].name,
          paymentMethod: PAYMENT_METHODS[paymentMethod].name,
          total: total
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Hiba történt a rendelés során')
      }

      const order = await response.json()
      
      // Kosár ürítése
      clearCart()
      
      // Átirányítás a thank you oldalra
      router.push('/thank-you')
    } catch (error) {
      console.error('Rendelés hiba:', error)
      toast.error(error instanceof Error ? error.message : 'Hiba történt a rendelés során')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Megrendelés véglegesítése</h1>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="space-y-6">
            {/* Szállítási módok */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Szállítási mód</h2>
              <div className="space-y-4">
                {Object.entries(SHIPPING_METHODS).map(([key, method]) => (
                  <label key={key} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="shipping"
                      value={key}
                      checked={shippingMethod === key}
                      onChange={(e) => setShippingMethod(e.target.value as keyof typeof SHIPPING_METHODS)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1">{method.name}</span>
                    <span className="font-medium">{formatPrice(method.price)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fizetési módok */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Fizetési mód</h2>
              <div className="space-y-4">
                {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                  <label key={key} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="payment"
                      value={key}
                      checked={paymentMethod === key}
                      onChange={(e) => setPaymentMethod(e.target.value as keyof typeof PAYMENT_METHODS)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{method.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Rendelés összegzése</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Részösszeg:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Szállítási költség:</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>

              <div className="flex justify-between border-t pt-4 font-bold">
                <span>Végösszeg:</span>
                <span>{formatPrice(total)}</span>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Feldolgozás...' : 'Megrendelés véglegesítése'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 