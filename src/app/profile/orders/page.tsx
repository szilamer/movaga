import React from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/profile/orders')
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Rendeléseim</h1>
      {orders.length === 0 ? (
        <p>Még nincs leadott rendelésed.</p>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-border bg-background p-6 text-foreground"
            >
              <div className="flex justify-between mb-4">
                <div>
                  <p className="font-semibold">Rendelés azonosító:</p>
                  <p>{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Dátum:</p>
                  <p>{new Date(order.createdAt).toLocaleString('hu-HU')}</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="font-semibold">Termékek:</p>
                <ul className="list-disc list-inside">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product.name} x{item.quantity} – {formatPrice(item.price)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p><span className="font-semibold">Státusz:</span> {order.status}</p>
                  <p><span className="font-semibold">Szállítás:</span> {order.shippingMethod}</p>
                  <p><span className="font-semibold">Fizetés:</span> {order.paymentMethod}</p>
                </div>
                <div className="text-lg font-bold">
                  Összesen: {formatPrice(order.total)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 