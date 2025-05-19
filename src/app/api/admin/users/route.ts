import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // URL paraméterek kinyerése
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    // Ha nincs megadva hónap/év, használjuk az aktuális hónapot
    const now = new Date();
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();

    // Hónap első és utolsó napja
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Felhasználók lekérése a vásárlásaikkal együtt
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        referrerId: true,
        createdAt: true,
        orders: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            id: true,
            total: true,
            createdAt: true,
            items: {
              select: {
                quantity: true,
                product: {
                  select: {
                    name: true,
                    pointValue: true
                  }
                }
              }
            }
          }
        },
        referrals: {
          select: {
            id: true,
            name: true,
            email: true,
            orders: {
              where: {
                createdAt: {
                  gte: startDate,
                  lte: endDate
                }
              },
              select: {
                id: true,
                total: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    // Felhasználók rendezése fa struktúrába
    const userMap = new Map();
    const rootUsers = [];

    // Először minden felhasználót beteszünk a Map-be
    users.forEach(user => {
      userMap.set(user.id, {
        ...user,
        children: [],
        totalSales: user.orders.reduce((sum, order) => sum + order.total, 0),
        networkSales: 0
      });
    });

    // Majd felépítjük a fa struktúrát
    users.forEach(user => {
      const userWithData = userMap.get(user.id);
      if (user.referrerId && userMap.has(user.referrerId)) {
        const parent = userMap.get(user.referrerId);
        parent.children.push(userWithData);
        // Hozzáadjuk a gyermek forgalmát a szülő network forgalmához
        parent.networkSales += userWithData.totalSales;
      } else {
        rootUsers.push(userWithData);
      }
    });

    // Rekurzívan kiszámoljuk a teljes hálózati forgalmat
    const calculateTotalNetworkSales = (user: any) => {
      let total = user.totalSales;
      for (const child of user.children) {
        total += calculateTotalNetworkSales(child);
      }
      user.networkSales = total - user.totalSales; // Kivonunk a saját forgalmat
      return total;
    };

    rootUsers.forEach(user => calculateTotalNetworkSales(user));

    return NextResponse.json(rootUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 