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

      const response = NextResponse.json({
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

      // Cache control headers hozzáadása a friss adatok biztosításához
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');

      return response;
    }

    // Felhasználó adatainak lekérése
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        referrals: {
          include: {
            orders: {
              where: {
                createdAt: {
                  gte: new Date(new Date().setDate(1))
                }
              }
            }
          }
        },
        orders: {
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1))
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Felhasználó nem található' },
        { status: 404 }
      );
    }

    // Személyes havi forgalom számítása
    const monthlySales = user.orders.reduce((total, order) => total + order.total, 0);

    // Hálózati tagok és forgalom számítása
    const networkMembers = user.referrals.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      monthlySales: member.orders.reduce((total, order) => total + order.total, 0),
      joinedAt: member.createdAt
    }));

    const totalNetworkSales = networkMembers.reduce((total, member) => total + member.monthlySales, 0);

    // Kedvezmény szint számítása
    const discountLevel = user.discountPercent || 0;
    const newDiscountValidUntil = user.discountValidUntil;

    // Jutalék számítása (6%)
    const commission = totalNetworkSales * 0.06;

    // Forgalom történet
    const salesHistory = await Promise.all(
      Array.from({ length: 6 }, async (_, i) => {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - i);
        
        const endDate = new Date(date);
        endDate.setMonth(endDate.getMonth() + 1);
        
        const monthlyOrders = await prisma.order.findMany({
          where: {
            OR: [
              {
                userId: user.id,
                createdAt: {
                  gte: date,
                  lt: endDate
                }
              },
              {
                user: {
                  referrerId: user.id
                },
                createdAt: {
                  gte: date,
                  lt: endDate
                }
              }
            ]
          }
        });
        
        return {
          date: date.toISOString(),
          amount: monthlyOrders.reduce((total, order) => total + order.total, 0)
        };
      })
    );
    salesHistory.reverse();

    // Jutalék történet
    const commissionHistory = await prisma.commission.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        type: true,
        createdAt: true,
        description: true
      }
    });

    const response = NextResponse.json({
      monthlySales,
      networkSize: networkMembers.length,
      discountLevel,
      discountValidUntil: newDiscountValidUntil,
      commission,
      salesHistory,
      networkMembers,
      commissionHistory: commissionHistory.length > 0 ? commissionHistory : [],
      totalNetworkSales,
      totalCommission: commission
    });

    // Cache control headers hozzáadása a friss adatok biztosításához
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Hiba történt a dashboard adatok lekérése közben:', error)
    return NextResponse.json(
      { error: 'Hiba történt a dashboard adatok lekérése közben' },
      { status: 500 }
    )
  }
} 
