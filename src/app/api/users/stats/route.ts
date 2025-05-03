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

    // Felhasználó adatainak lekérése
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        referrals: true,
        orders: {
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1)) // Aktuális hónap első napja
            }
          },
          include: {
            items: true
          }
        }
      }
    })

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
              }
            },
            select: {
              total: true
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
              }
            },
            select: {
              total: true
            }
          }
        }
      }) as NetworkMember[];
    }

    // Havi forgalom számítása
    const monthlySales = user.orders.reduce((total: number, order: OrderWithItems) => total + order.total, 0)

    // Hálózati forgalom számítása
    const networkMembersSales = networkMembers.map((member: NetworkMember) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      monthlySales: member.orders.reduce((total: number, order: { total: number }) => total + order.total, 0),
      joinedAt: member.createdAt
    }))

    const totalNetworkSales = networkMembersSales.reduce((total: number, member: { monthlySales: number }) => total + member.monthlySales, 0)

    // Kedvezmény szint számítása - Adminoknak mindig a legmagasabb
    let discountLevel = isAdmin ? 100 : 0;
    
    if (!isAdmin) {
      if (monthlySales >= 100000) {
        discountLevel = 30;
      } else if (monthlySales >= 50000) {
        discountLevel = 15;
      }

      // Frissítsük a felhasználó kedvezményszintjét az adatbázisban is
      if (user.discountPercent !== discountLevel) {
        await prisma.user.update({
          where: { id: user.id },
          data: { discountPercent: discountLevel }
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
            }
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
