import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '3months' // 1month, 3months, 6months, 1year, all

    // Időszak meghatározása
    let startDate: Date | undefined
    const now = new Date()

    switch (timeframe) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        break
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        break
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        break
      case 'all':
        startDate = undefined
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    }

    // Felhasználó adatainak lekérése
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        orders: {
          where: startDate ? {
            createdAt: {
              gte: startDate
            }
          } : {},
          include: {
            items: {
              include: {
                product: {
                  select: {
                    pointValue: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        referrals: {
          include: {
            orders: {
              where: startDate ? {
                createdAt: {
                  gte: startDate
                }
              } : {},
              include: {
                items: {
                  include: {
                    product: {
                      select: {
                        pointValue: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Felhasználó nem található' },
        { status: 404 }
      )
    }

    // Személyes pontok számítása
    const personalPoints = user.orders.reduce((total, order) => {
      return total + order.items.reduce((orderTotal, item) => {
        return orderTotal + (item.product.pointValue * item.quantity)
      }, 0)
    }, 0)

    // Hálózati pontok számítása
    const networkPoints = user.referrals.reduce((total, referral) => {
      return total + referral.orders.reduce((referralTotal, order) => {
        return referralTotal + order.items.reduce((orderTotal, item) => {
          return orderTotal + (item.product.pointValue * item.quantity)
        }, 0)
      }, 0)
    }, 0)

    const totalPoints = personalPoints + networkPoints

    // Kedvezményszint meghatározása az elmúlt 3 hónap alapján
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    
    const recentPersonalPoints = user.orders
      .filter(order => order.createdAt >= threeMonthsAgo)
      .reduce((total, order) => {
        return total + order.items.reduce((orderTotal, item) => {
          return orderTotal + (item.product.pointValue * item.quantity)
        }, 0)
      }, 0)

    const recentNetworkPoints = user.referrals.reduce((total, referral) => {
      return total + referral.orders
        .filter(order => order.createdAt >= threeMonthsAgo)
        .reduce((referralTotal, order) => {
          return referralTotal + order.items.reduce((orderTotal, item) => {
            return orderTotal + (item.product.pointValue * item.quantity)
          }, 0)
        }, 0)
    }, 0)

    const recentTotalPoints = recentPersonalPoints + recentNetworkPoints

    // Kedvezményszint meghatározása
    let discountLevel = 0
    let discountPercent = 0
    
    if (recentTotalPoints >= 100) {
      discountLevel = 2
      discountPercent = 30
    } else if (recentTotalPoints >= 50) {
      discountLevel = 1
      discountPercent = 15
    }

    // Felhasználó kedvezményszintjének frissítése, ha szükséges
    if (user.discountPercent !== discountPercent) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          discountPercent,
          discountValidUntil: new Date(now.getFullYear(), now.getMonth() + 3, 0) // 3 hónap múlva lejár
        }
      })
    }

    // Részletes pontok listája
    const pointsHistory = [
      ...user.orders.map(order => ({
        id: order.id,
        date: order.createdAt,
        type: 'personal' as const,
        description: 'Személyes vásárlás',
        points: order.items.reduce((total, item) => total + (item.product.pointValue * item.quantity), 0),
        items: order.items.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          pointValue: item.product.pointValue,
          totalPoints: item.product.pointValue * item.quantity
        }))
      })),
      ...user.referrals.flatMap(referral => 
        referral.orders.map(order => ({
          id: order.id,
          date: order.createdAt,
          type: 'network' as const,
          description: `Hálózati vásárlás - ${referral.name || referral.email}`,
          points: order.items.reduce((total, item) => total + (item.product.pointValue * item.quantity), 0),
          items: order.items.map(item => ({
            productName: item.product.name,
            quantity: item.quantity,
            pointValue: item.product.pointValue,
            totalPoints: item.product.pointValue * item.quantity
          }))
        }))
      )
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      personalPoints,
      networkPoints,
      totalPoints,
      recentTotalPoints,
      discountLevel,
      discountPercent,
      pointsHistory,
      timeframe
    })

  } catch (error) {
    console.error('Hiba történt a pontok lekérése közben:', error)
    return NextResponse.json(
      { error: 'Hiba történt a pontok lekérése közben' },
      { status: 500 }
    )
  }
} 