import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib/prisma'

// Rekurzív hálózatgyűjtő, visszaadja a userId alatti összes referrált felhasználó ID-ját
async function getNetworkMembersRecursive(userId: string, depth = 0, maxDepth = 10): Promise<string[]> {
  if (depth >= maxDepth) return []
  const members: { id: string }[] = await prisma.user.findMany({
    where: { referrerId: userId },
    select: { id: true }
  })
  const childrenLists: string[][] = await Promise.all(
    members.map(m => getNetworkMembersRecursive(m.id, depth + 1, maxDepth))
  )
  return members.map(m => m.id).concat(...childrenLists.flat())
}

// GET: a bejelentkezett felhasználó (vagy admin esetén mindenki) rendelései
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nem vagy bejelentkezve' }, { status: 401 })
  }
  const userId = session.user.id
  let userIds = [userId]
  if (session.user.role !== 'ADMIN') {
    const networkIds = await getNetworkMembersRecursive(userId)
    userIds = [userId, ...networkIds]
  }
  const filter = session.user.role === 'ADMIN' ? {} : { userId: { in: userIds } }
  const orders = await prisma.order.findMany({
    where: filter,
    include: {
      items: { include: { product: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(orders)
}

// PATCH: rendelés státuszának módosítása jogosultság ellenőrzéssel
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nem vagy bejelentkezve' }, { status: 401 })
  }
  const { orderId, status } = await request.json()
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) {
    return NextResponse.json({ error: 'Rendelés nem található' }, { status: 404 })
  }
  const canEdit = session.user.role === 'ADMIN'
    || order.userId === session.user.id
    || (await getNetworkMembersRecursive(session.user.id)).includes(order.userId)
  if (!canEdit) {
    return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 })
  }
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status }
  })
  return NextResponse.json(updated)
} 