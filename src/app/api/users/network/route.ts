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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nem vagy bejelentkezve' },
        { status: 401 }
      )
    }

    // Admin esetén a teljes hálózatot lekérjük
    let rootUserId = session.user.id;
    if (session.user.role === 'ADMIN') {
      const rootUsers = await prisma.user.findMany({
        where: {
          referrerId: null,
        },
        select: {
          id: true,
        },
      });
      
      const allNetworks = await Promise.all(
        rootUsers.map(user => getNetworkMembersRecursive(user.id))
      );

      return NextResponse.json({
        members: allNetworks.flat(),
      });
    }

    // Normál felhasználó esetén csak a saját hálózatát kérjük le
    const networkMembers = await getNetworkMembersRecursive(rootUserId);

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
