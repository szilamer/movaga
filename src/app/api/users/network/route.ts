import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'
import prisma from '@/lib/prisma'

interface NetworkMember {
  id: string;
  name: string | null;
  email: string | null;
  monthlySales: number;
  joinedAt: Date;
  role: string;
  referralCount: number;
  children: NetworkMember[];
}

async function getNetworkMembersRecursive(userId: string, depth: number = 0, maxDepth: number = 10): Promise<NetworkMember[]> {
  if (depth >= maxDepth) return [];

  const members = await prisma.user.findMany({
    where: {
      referrerId: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      role: true,
      _count: {
        select: {
          referrals: true,
        },
      },
    },
  });

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const membersWithSalesAndChildren: NetworkMember[] = await Promise.all(
    members.map(async (member): Promise<NetworkMember> => {
      // Figyelembe vesszük a PROCESSING, SHIPPED és COMPLETED rendeléseket is
      const validOrders = await prisma.order.findMany({
        where: {
          userId: member.id,
          createdAt: {
            gte: firstDayOfMonth,
          },
          status: {
            in: ['PROCESSING', 'SHIPPED', 'COMPLETED'] // Kibővítjük a státuszokat
          }
        },
        include: {
          items: true
        }
      });

      // Számoljuk ki a termékek árát (szállítási költség nélkül)
      const monthlySalesTotal = validOrders.reduce((total, order) => {
        const orderItemsTotal = order.items.reduce((itemsTotal, item) => 
          itemsTotal + (item.price * item.quantity), 0);
        return total + orderItemsTotal;
      }, 0);

      const children: NetworkMember[] = await getNetworkMembersRecursive(member.id, depth + 1, maxDepth);

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        monthlySales: monthlySalesTotal,
        joinedAt: member.createdAt,
        role: member.role,
        referralCount: member._count.referrals,
        children,
      };
    })
  );

  return membersWithSalesAndChildren;
}

// Admin felhasználó kezelése
async function getAdminAsRoot(userId: string, session: any): Promise<NetworkMember> {
  // Ellenőrizzük, hogy admin-id-e a userId, ez jelzi a hardcoded admin-t
  if (userId === 'admin-id') {
    console.log('[NETWORK] Hardcoded admin detected, using session data');
    
    // Lekérjük a null referrer-rel rendelkező felhasználókat
    const nullReferrerUsers = await getNullReferrerUsers();

    // Létrehozunk egy virtuális admin felhasználót a session alapján
    return {
      id: session.user.id,
      name: session.user.name || 'Admin',
      email: session.user.email || 'admin@movaga.hu',
      monthlySales: 0,
      joinedAt: new Date(),
      role: 'SUPERADMIN',
      referralCount: nullReferrerUsers.length,
      children: nullReferrerUsers,
    };
  }

  // Próbáljuk megtalálni az admint az adatbázisban
  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      role: true,
      _count: {
        select: {
          referrals: true,
        },
      },
    },
  });
  
  // Ha nincs az adatbázisban, használjuk a session adatait
  if (!admin) {
    console.log('[NETWORK] Admin user not found in database, using session data');
    
    // Lekérjük az összes felhasználót
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        referrerId: true,
      },
    });
    
    // Lekérjük a null referrer-rel rendelkező felhasználókat
    const nullReferrerUsers = await getNullReferrerUsers();

    // Létrehozunk egy virtuális admin felhasználót a session alapján
    return {
      id: session.user.id,
      name: session.user.name || 'Admin',
      email: session.user.email || 'admin@movaga.hu',
      monthlySales: 0,
      joinedAt: new Date(),
      role: 'SUPERADMIN',
      referralCount: allUsers.filter(user => user.referrerId === null).length,
      children: nullReferrerUsers,
    };
  }
  
  // Normál eset, ha megtaláltuk az admint az adatbázisban
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Figyelembe vesszük a PROCESSING, SHIPPED és COMPLETED rendeléseket is
  const validOrders = await prisma.order.findMany({
    where: {
      userId: admin.id,
      createdAt: {
        gte: firstDayOfMonth,
      },
      status: {
        in: ['PROCESSING', 'SHIPPED', 'COMPLETED'] // Kibővítjük a státuszokat
      }
    },
    include: {
      items: true
    }
  });

  // Számoljuk ki a termékek árát (szállítási költség nélkül)
  const monthlySalesTotal = validOrders.reduce((total, order) => {
    const orderItemsTotal = order.items.reduce((itemsTotal, item) => 
      itemsTotal + (item.price * item.quantity), 0);
    return total + orderItemsTotal;
  }, 0);
  
  // Lekérjük az admin közvetlen hálózati tagjait
  const children = await getNetworkMembersRecursive(admin.id);
  
  // Lekérjük a null referrer-rel rendelkező felhasználókat is, ha az admin SUPERADMIN
  const nullReferrerUsers = admin.role === 'SUPERADMIN' ? 
    await getNullReferrerUsers() : [];
  
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    monthlySales: monthlySalesTotal,
    joinedAt: admin.createdAt,
    role: admin.role,
    referralCount: admin._count.referrals + nullReferrerUsers.length,
    children: [...children, ...nullReferrerUsers],
  };
}

// Null referrer-rel rendelkező felhasználók lekérése
async function getNullReferrerUsers(): Promise<NetworkMember[]> {
  const users = await prisma.user.findMany({
    where: {
      referrerId: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      role: true,
      _count: {
        select: {
          referrals: true,
        },
      },
    },
  });
  
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const usersWithSalesAndChildren: NetworkMember[] = await Promise.all(
    users.map(async (user): Promise<NetworkMember> => {
      // Figyelembe vesszük a PROCESSING, SHIPPED és COMPLETED rendeléseket is
      const validOrders = await prisma.order.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: firstDayOfMonth,
          },
          status: {
            in: ['PROCESSING', 'SHIPPED', 'COMPLETED'] // Kibővítjük a státuszokat
          }
        },
        include: {
          items: true
        }
      });

      // Számoljuk ki a termékek árát (szállítási költség nélkül)
      const monthlySalesTotal = validOrders.reduce((total, order) => {
        const orderItemsTotal = order.items.reduce((itemsTotal, item) => 
          itemsTotal + (item.price * item.quantity), 0);
        return total + orderItemsTotal;
      }, 0);

      const children: NetworkMember[] = await getNetworkMembersRecursive(user.id);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        monthlySales: monthlySalesTotal,
        joinedAt: user.createdAt,
        role: user.role,
        referralCount: user._count.referrals,
        children,
      };
    })
  );
  
  return usersWithSalesAndChildren;
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

    let networkData: NetworkMember;

    // Admin/SuperAdmin specifikus kezelés
    if (session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') {
      networkData = await getAdminAsRoot(session.user.id, session);
    } else {
      // Normál felhasználó esetén
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
          _count: {
            select: {
              referrals: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Felhasználó nem található' },
          { status: 404 }
        );
      }

      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      // Figyelembe vesszük a PROCESSING, SHIPPED és COMPLETED rendeléseket is
      const validOrders = await prisma.order.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: firstDayOfMonth,
          },
          status: {
            in: ['PROCESSING', 'SHIPPED', 'COMPLETED'] // Kibővítjük a státuszokat
          }
        },
        include: {
          items: true
        }
      });

      // Számoljuk ki a termékek árát (szállítási költség nélkül)
      const monthlySalesTotal = validOrders.reduce((total, order) => {
        const orderItemsTotal = order.items.reduce((itemsTotal, item) => 
          itemsTotal + (item.price * item.quantity), 0);
        return total + orderItemsTotal;
      }, 0);

      const children = await getNetworkMembersRecursive(user.id);

      networkData = {
        id: user.id,
        name: user.name,
        email: user.email,
        monthlySales: monthlySalesTotal,
        joinedAt: user.createdAt,
        role: user.role,
        referralCount: user._count.referrals,
        children,
      };
    }

    const response = NextResponse.json([networkData]);

    // Cache control headers hozzáadása a friss adatok biztosításához
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Network API error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a hálózati adatok lekérése során' },
      { status: 500 }
    );
  }
} 
