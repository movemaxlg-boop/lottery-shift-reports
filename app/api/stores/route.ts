

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET all stores for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get all stores the user has access to
    const userStores = await prisma.userStore.findMany({
      where: { userId },
      include: {
        store: {
          include: {
            settings: true,
          },
        },
      },
    });

    const stores = userStores.map(us => us.store);

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

// POST create a new store (managers only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { name, address, phone } = body;

    if (!name) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
    }

    // Create store
    const store = await prisma.store.create({
      data: {
        name,
        address,
        phone,
        userStores: {
          create: {
            userId,
          },
        },
        settings: {
          create: {
            morningStart: '06:00',
            morningEnd: '14:00',
            afternoonStart: '14:00',
            afternoonEnd: '22:00',
          },
        },
      },
      include: {
        settings: true,
      },
    });

    return NextResponse.json({ store });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}
