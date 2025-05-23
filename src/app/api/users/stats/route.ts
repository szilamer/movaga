import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true }
}>

type NetworkMember = {
  id: string
  name: string | null
  email: string
  orders: { total: number }[]
  createdAt: Date
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    // Admin/SuperAdmin specifikus vagy normál felhasználói adatok kezelése
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN';
    const isHardcodedAdmin = session.user.id === 'admin-id';

    // Hardkódolt admin felhasználó közvetlen kezelése
    if (isHardcodedAdmin) {
      console.log('[STATS] Using hardcoded admin (admin-id) with session data');
      
      // Lekérjük az összes felhasználót az adminon kívül
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          orders: {
            where: {
              createdAt: {
                gte: new Date(new Date().setDate(1))
              }
            },
            select: {
              total: true
            }
          }
        }
      }) as NetworkMember[];

      // Hálózati forgalom számítása
      const networkMembersSales = allUsers.map((member: NetworkMember) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        monthlySales: member.orders.reduce((total: number, order: { total: number }) => total + order.total, 0),
        joinedAt: member.createdAt
      }));

      const totalNetworkSales = networkMembersSales.reduce((total: number, member: { monthlySales: number }) => total + member.monthlySales, 0);
      
      // Teljes webshop forgalom az aktuális hónapban
      const totalSales = await prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1))
          }
        }
      });
      
      // Forgalom történet az adminok számára
      const lastSixMonths = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setDate(1); // Hónap első napja
        date.setMonth(date.getMonth() - i);
        
        const endDate = new Date(date);
        endDate.setMonth(endDate.getMonth() + 1);
        
        lastSixMonths.push({
          startDate: date,
          endDate: endDate,
          monthLabel: date.toISOString()
        });
      }
      
      const salesHistory = await Promise.all(
        lastSixMonths.map(async ({startDate, endDate, monthLabel}) => {
          const monthlyTotal = await prisma.order.aggregate({
            _sum: { total: true },
            where: {
              createdAt: {
                gte: startDate,
                lt: endDate
              }
            }
          });
          
          return {
            date: monthLabel,
            amount: monthlyTotal._sum.total || 0
          };
        })
      );
      salesHistory.reverse();
      
      // Jutalék történet (dummy adat adminoknak)
      const commissionHistory = Array.from({ length: 5 }, (_, i) => ({
        id: `comm_${i}`,
        amount: Math.floor(Math.random() * 10000),
        type: i % 2 === 0 ? 'personal' : 'network',
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        description: i % 2 === 0 ? 'Személyes forgalom után' : 'Hálózati forgalom után'
      }));

      return NextResponse.json({
        monthlySales: totalSales._sum.total || 0,
        networkSize: allUsers.length,
        discountLevel: 100, // Admin kedvezmény
        commission: (totalSales._sum.total || 0) * 0.06,
        salesHistory: salesHistory,
        networkMembers: networkMembersSales,
        commissionHistory: commissionHistory,
        totalNetworkSales: totalNetworkSales,
        totalCommission: (totalSales._sum.total || 0) * 0.06
      });
    }

    // Felhasználó adatainak lekérése
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        discountPercent: true,
        discountValidUntil: true,
        referrals: true,
        orders: {
          select: {
            createdAt: true,
            items: {
              select: {
                quantity: true,
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
    })

    // Nem hardkódolt admin, de nincs az adatbázisban - hiba
    if (!user && isAdmin) {
      console.log('[STATS] Admin user not found in database, using session data');
      
      // Lekérjük az összes felhasználót az adminon kívül
      const allUsers = await prisma.user.findMany({
        where: { 
          id: { 
            not: session.user.id 
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          orders: {
            where: {
              createdAt: {
                gte: new Date(new Date().setDate(1))
              }
            },
            select: {
              total: true
            }
          }
        }
      }) as NetworkMember[];

      // Hálózati forgalom számítása
      const networkMembersSales = allUsers.map((member: NetworkMember) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        monthlySales: member.orders.reduce((total: number, order: { total: number }) => total + order.total, 0),
        joinedAt: member.createdAt
      }));

      const totalNetworkSales = networkMembersSales.reduce((total: number, member: { monthlySales: number }) => total + member.monthlySales, 0);
      
      // Teljes webshop forgalom az aktuális hónapban
      const totalSales = await prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1))
          }
        }
      });
      
      // Forgalom történet az adminok számára
      const lastSixMonths = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setDate(1); // Hónap első napja
        date.setMonth(date.getMonth() - i);
        
        const endDate = new Date(date);
        endDate.setMonth(endDate.getMonth() + 1);
        
        lastSixMonths.push({
          startDate: date,
          endDate: endDate,
          monthLabel: date.toISOString()
        });
      }
      
      const salesHistory = await Promise.all(
        lastSixMonths.map(async ({startDate, endDate, monthLabel}) => {
          const monthlyTotal = await prisma.order.aggregate({
            _sum: { total: true },
            where: {
              createdAt: {
                gte: startDate,
                lt: endDate
              }
            }
          });
          
          return {
            date: monthLabel,
            amount: monthlyTotal._sum.total || 0
          };
        })
      );
      salesHistory.reverse();
      
      // Jutalék történet (dummy adat adminoknak)
      const commissionHistory = Array.from({ length: 5 }, (_, i) => ({
        id: `comm_${i}`,
        amount: Math.floor(Math.random() * 10000),
        type: i % 2 === 0 ? 'personal' : 'network',
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        description: i % 2 === 0 ? 'Személyes forgalom után' : 'Hálózati forgalom után'
      }));

      return NextResponse.json({
        monthlySales: totalSales._sum.total || 0,
        networkSize: allUsers.length,
        discountLevel: 100, // Admin kedvezmény
        commission: (totalSales._sum.total || 0) * 0.06,
        salesHistory: salesHistory,
        networkMembers: networkMembersSales,
        commissionHistory: commissionHistory,
        totalNetworkSales: totalNetworkSales,
        totalCommission: (totalSales._sum.total || 0) * 0.06
      });
    }

    // Normál felhasználó vagy adatbázisban lévő admin kezelése
    if (!user) {
      return NextResponse.json(
        { error: 'A felhasználó nem található' },
        { status: 404 }
      )
    }

    // Hálózati tagok lekérése - különböző lekérdezés admin felhasználóknak
    let networkMembers: NetworkMember[] = [];
    
    if (isAdmin) {
      // Admin esetén az összes felhasználót lekérjük kivéve önmagát
      networkMembers = await prisma.user.findMany({
        where: { 
          id: { 
            not: session.user.id 
          },
          // SuperAdmin esetén minden felhasználó, ADMIN esetén csak a saját hálózat
          ...(session.user.role === 'ADMIN' ? { referrerId: session.user.id } : {})
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          orders: {
            where: {
              createdAt: {
                gte: new Date(new Date().setDate(1))
              },
              status: 'COMPLETED' // Csak teljesített rendelések számítanak
            },
            include: {
              items: true
            }
          }
        }
      }) as NetworkMember[];
    } else {
      // Normál felhasználó esetén csak a közvetlen tagok
      networkMembers = await prisma.user.findMany({
        where: { referrerId: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          orders: {
            where: {
              createdAt: {
                gte: new Date(new Date().setDate(1))
              },
              status: 'COMPLETED' // Csak teljesített rendelések számítanak
            },
            include: {
              items: true
            }
          }
        }
      }) as NetworkMember[];
    }

    // Hálózati tagok forgalmának számítása (változatlan)
    const networkMembersSales = networkMembers.map((member: any) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      monthlySales: member.orders.reduce((total: number, order: any) => {
        const orderItemsTotal = order.items.reduce((itemsTotal: number, item: any) =>
          itemsTotal + (item.price * item.quantity), 0);
        return total + orderItemsTotal;
      }, 0),
      joinedAt: member.createdAt
    }));
    const totalNetworkSales = networkMembersSales.reduce((total: number, member: { monthlySales: number }) => total + member.monthlySales, 0);

    // Aktuális hónap pontjainak számítása
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthlyPoints = user.orders
      .filter(order => order.createdAt >= monthStart && order.createdAt < monthEnd)
      .reduce((total, order) => {
        const orderPoints = order.items.reduce((itemTotal, item) =>
          itemTotal + (item.product?.pointValue || 0) * item.quantity, 0);
        return total + orderPoints;
      }, 0);

    // Kedvezmény szint számítása 3 hónapos érvényességgel, pontok alapján
    let discountLevel = isAdmin ? 100 : 0;
    let discountValidUntil = user.discountValidUntil ? new Date(user.discountValidUntil) : null;
    let shouldUpdate = false;
    let newDiscountValidUntil = discountValidUntil;

    if (!isAdmin) {
      // Ha most eléri valamelyik szintet, frissítjük a szintet és a lejárati dátumot
      if (monthlyPoints >= 100) {
        discountLevel = 30;
        newDiscountValidUntil = new Date(monthEnd);
        newDiscountValidUntil.setMonth(newDiscountValidUntil.getMonth() + 3);
        shouldUpdate = true;
      } else if (monthlyPoints >= 50) {
        discountLevel = 15;
        newDiscountValidUntil = new Date(monthEnd);
        newDiscountValidUntil.setMonth(newDiscountValidUntil.getMonth() + 3);
        shouldUpdate = true;
      } else if (discountValidUntil && discountValidUntil > now) {
        // Ha még érvényes a kedvezmény, megtartjuk a szintet
        discountLevel = user.discountPercent;
      } else {
        // Lejárt a kedvezmény
        discountLevel = 0;
        newDiscountValidUntil = null;
        shouldUpdate = true;
      }
      // Csak akkor frissítünk, ha változott valami
      if (
        user.discountPercent !== discountLevel ||
        (discountValidUntil?.getTime() !== newDiscountValidUntil?.getTime())
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: { discountPercent: discountLevel, discountValidUntil: newDiscountValidUntil },
        });
      }
    }

    // Jutalék számítása (6%) - adminoknak a teljes forgalom után
    const totalSales = isAdmin 
      ? (await prisma.order.aggregate({
          _sum: { total: true },
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1))
            },
            status: 'COMPLETED' // Csak teljesített rendelések számítanak
          }
        }))._sum.total || 0
      : totalNetworkSales;
      
    const commission = totalSales * 0.06;

    // Forgalom történet - adminoknak valós adatok
    let salesHistory = [];
    
    if (isAdmin) {
      // Elmúlt 6 hónap valós forgalmi adatai az adminok számára
      const lastSixMonths = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setDate(1); // Hónap első napja
        date.setMonth(date.getMonth() - i);
        
        const endDate = new Date(date);
        endDate.setMonth(endDate.getMonth() + 1);
        
        lastSixMonths.push({
          startDate: date,
          endDate: endDate,
          monthLabel: date.toISOString()
        });
      }
      
      salesHistory = await Promise.all(
        lastSixMonths.map(async ({startDate, endDate, monthLabel}) => {
          // Lekérdezzük az összes rendelést az adott időszakban
          const completedOrders = await prisma.order.findMany({
            where: {
              createdAt: {
                gte: startDate,
                lt: endDate
              },
              status: 'COMPLETED' // Csak teljesített rendelések számítanak
            },
            include: {
              items: true
            }
          });
          
          // Számoljuk ki a termékek árát (szállítási költség nélkül)
          const monthlyTotal = completedOrders.reduce((total, order) => {
            const orderItemsTotal = order.items.reduce((itemsTotal, item) => 
              itemsTotal + (item.price * item.quantity), 0);
            return total + orderItemsTotal;
          }, 0);
          
          return {
            date: monthLabel,
            amount: monthlyTotal
          };
        })
      );
      salesHistory.reverse();
    } else {
      // Dummy adat a normál felhasználók számára
      salesHistory = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          date: date.toISOString(),
          amount: Math.floor(Math.random() * 100000)
        };
      }).reverse();
    }

    // Jutalék történet - adminoknak valós adat helyett
    const commissionHistory = Array.from({ length: 5 }, (_, i) => ({
      id: `comm_${i}`,
      amount: Math.floor(Math.random() * 10000),
      type: i % 2 === 0 ? 'personal' : 'network',
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      description: i % 2 === 0 ? 'Személyes forgalom után' : 'Hálózati forgalom után'
    }));

    return NextResponse.json({
      monthlySales: isAdmin ? totalSales : monthlySales,
      networkSize: networkMembers.length,
      discountLevel,
      discountValidUntil: newDiscountValidUntil,
      commission,
      salesHistory,
      networkMembers: networkMembersSales,
      commissionHistory,
      totalNetworkSales,
      totalCommission: commission
    })
  } catch (error) {
    console.error('Hiba történt a dashboard adatok lekérése közben:', error)
    return NextResponse.json(
      { error: 'Hiba történt a dashboard adatok lekérése közben' },
      { status: 500 }
    )
  }
} 
