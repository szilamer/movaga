import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const shippingMethod = await prisma.shippingMethod.findFirst({
      where: {
        name: decodeURIComponent(params.name),
      },
    });

    if (!shippingMethod) {
      return NextResponse.json(
        { error: 'Shipping method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(shippingMethod);
  } catch (error) {
    console.error('Error fetching shipping method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 