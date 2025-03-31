import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/card'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  // Statisztikák lekérése
  const stats = await prisma.$transaction([
    // Összes rendelés száma
    prisma.order.count(),
    // Mai rendelések száma
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    // Összes termék száma
    prisma.product.count(),
    // Összes felhasználó száma
    prisma.user.count(),
  ])

  const [totalOrders, todayOrders, totalProducts, totalUsers] = stats

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Vezérlőpult</h1>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Összes rendelés</h3>
            <p className="mt-2 text-3xl font-semibold">{totalOrders}</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Mai rendelések</h3>
            <p className="mt-2 text-3xl font-semibold">{todayOrders}</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Összes termék</h3>
            <p className="mt-2 text-3xl font-semibold">{totalProducts}</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Felhasználók</h3>
            <p className="mt-2 text-3xl font-semibold">{totalUsers}</p>
          </div>
        </Card>
      </div>

      {/* TODO: Grafikonok */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Rendelések</h3>
          {/* TODO: Rendelések grafikon */}
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Bevétel</h3>
          {/* TODO: Bevétel grafikon */}
        </div>
      </div>
    </div>
  )
} 