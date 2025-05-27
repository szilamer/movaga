import prisma from '@/lib/prisma'

/**
 * Kiszámítja és hozzáadja a jutalékpontokat egy rendelés alapján
 * @param orderId - A rendelés azonosítója
 */
export async function calculateAndAddPoints(orderId: string) {
  try {
    // Rendelés lekérése a termékekkel együtt
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
        },
        user: {
          select: {
            id: true,
            referrerId: true
          }
        }
      }
    })

    if (!order || !order.user) {
      console.log(`Order ${orderId} not found or has no user`)
      return
    }

    // Személyes pontok számítása
    const personalPoints = order.items.reduce((total, item) => {
      return total + (item.product.pointValue * item.quantity)
    }, 0)

    if (personalPoints > 0) {
      // Commission rekord létrehozása a személyes pontokhoz
      await prisma.commission.create({
        data: {
          userId: order.user.id,
          amount: personalPoints,
          type: 'personal',
          description: `Személyes vásárlás pontjai - Rendelés: ${orderId}`
        }
      })

      console.log(`Added ${personalPoints} personal points for user ${order.user.id} from order ${orderId}`)
    }

    // Ha van referrer, akkor hálózati pontokat is ad
    if (order.user.referrerId && personalPoints > 0) {
      await prisma.commission.create({
        data: {
          userId: order.user.referrerId,
          amount: personalPoints,
          type: 'network',
          description: `Hálózati vásárlás pontjai - Rendelés: ${orderId}`
        }
      })

      console.log(`Added ${personalPoints} network points for referrer ${order.user.referrerId} from order ${orderId}`)
    }

    // Kedvezményszintek frissítése mindkét felhasználónál
    await updateDiscountLevels([order.user.id])
    if (order.user.referrerId) {
      await updateDiscountLevels([order.user.referrerId])
    }

  } catch (error) {
    console.error('Error calculating and adding points:', error)
  }
}

/**
 * Frissíti a felhasználók kedvezményszintjeit a pontjaik alapján
 * @param userIds - A frissítendő felhasználók azonosítói
 */
export async function updateDiscountLevels(userIds: string[]) {
  try {
    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

    for (const userId of userIds) {
      // Felhasználó pontjainak lekérése az elmúlt 3 hónapból
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          orders: {
            where: {
              createdAt: {
                gte: threeMonthsAgo
              }
            },
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      pointValue: true
                    }
                  }
                }
              }
            }
          },
          referrals: {
            include: {
              orders: {
                where: {
                  createdAt: {
                    gte: threeMonthsAgo
                  }
                },
                include: {
                  items: {
                    include: {
                      product: {
                        select: {
                          pointValue: true
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

      if (!user) continue

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

      // Kedvezményszint meghatározása
      let discountPercent = 0
      
      if (totalPoints >= 100) {
        discountPercent = 30
      } else if (totalPoints >= 50) {
        discountPercent = 15
      }

      // Felhasználó frissítése, ha változott a kedvezményszint
      if (user.discountPercent !== discountPercent) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            discountPercent,
            discountValidUntil: new Date(now.getFullYear(), now.getMonth() + 3, 0) // 3 hónap múlva lejár
          }
        })

        console.log(`Updated discount level for user ${userId}: ${discountPercent}% (${totalPoints} points)`)
      }
    }
  } catch (error) {
    console.error('Error updating discount levels:', error)
  }
}

/**
 * Lekéri egy felhasználó pontjait egy adott időszakban
 * @param userId - A felhasználó azonosítója
 * @param startDate - A kezdő dátum (opcionális)
 * @returns A pontok összesítése
 */
export async function getUserPoints(userId: string, startDate?: Date) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      return {
        personalPoints: 0,
        networkPoints: 0,
        totalPoints: 0
      }
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

    return {
      personalPoints,
      networkPoints,
      totalPoints: personalPoints + networkPoints
    }
  } catch (error) {
    console.error('Error getting user points:', error)
    return {
      personalPoints: 0,
      networkPoints: 0,
      totalPoints: 0
    }
  }
} 