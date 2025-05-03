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
      const monthlySales = await prisma.order.aggregate({
        where: {
          userId: member.id,
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
        _sum: {
          total: true,
        },
      });

      const children: NetworkMember[] = await getNetworkMembersRecursive(member.id, depth + 1, maxDepth);

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        monthlySales: monthlySales._sum.total || 0,
        joinedAt: member.createdAt,
        role: member.role,
        referralCount: member._count.referrals,
        children,
      };
    })
  );

  return membersWithSalesAndChildren;
}

// Admin felhasználó saját adatainak lekérése a hálózat gyökereként
async function getAdminAsRoot(userId: string): Promise<NetworkMember> {
  const admin = await prisma.user.findUnique({
    where: {
      id: userId,
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
  
  if (!admin) {
    throw new Error('Admin felhasználó nem található');
  }
  
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const monthlySales = await prisma.order.aggregate({
    where: {
      userId: admin.id,
      createdAt: {
        gte: firstDayOfMonth,
      },
    },
    _sum: {
      total: true,
    },
  });
  
  // Lekérjük az admin közvetlen hálózati tagjait
  const children = await getNetworkMembersRecursive(admin.id);
  
  // Lekérjük a null referrer-rel rendelkező felhasználókat is, ha az admin SUPERADMIN
  const nullReferrerUsers = admin.role === 'SUPERADMIN' ? 
    await getNullReferrerUsers() : [];
  
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    monthlySales: monthlySales._sum.total || 0,
    joinedAt: admin.createdAt,
    role: admin.role,
    referralCount: admin._count.referrals,
    children: [...children, ...nullReferrerUsers.filter(u => u.id !== admin.id)],
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
      const monthlySales = await prisma.order.aggregate({
        where: {
          userId: user.id,
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
        _sum: {
          total: true,
        },
      });

      const children: NetworkMember[] = await getNetworkMembersRecursive(user.id);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        monthlySales: monthlySales._sum.total || 0,
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

    // Admin esetén a felhasználót tesszük a hálózat gyökerébe
    if (session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') {
      const adminWithNetwork = await getAdminAsRoot(session.user.id);
      
      return NextResponse.json({
        members: [adminWithNetwork],
      });
    }

    // Normál felhasználó esetén csak a saját hálózatát kérjük le
    const networkMembers = await getNetworkMembersRecursive(session.user.id);

    return NextResponse.json({
      members: networkMembers,
    });
  } catch (error) {
    console.error('Hiba történt a hálózati tagok lekérése közben:', error)
    return NextResponse.json(
      { error: 'Hiba történt a hálózati tagok lekérése közben' },
      { status: 500 }
    )
  }
} 
