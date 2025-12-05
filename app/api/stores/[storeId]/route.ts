

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET a specific store
export async function GET(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { storeId } = params;

    // Check if user has access to this store
    const userStore = await prisma.userStore.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
      include: {
        store: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ store: userStore.store });
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}

// PUT update a store (managers only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { storeId } = params;
    const body = await req.json();
    const { name, address, phone } = body;

    // Check if user has access to this store
    const userStore = await prisma.userStore.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    if (!userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Update store
    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        name,
        address,
        phone,
      },
      include: {
        settings: true,
      },
    });

    return NextResponse.json({ store });
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}

// DELETE a store (managers only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { storeId } = params;

    // Check if user has access to this store
    const userStore = await prisma.userStore.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    if (!userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Delete store (cascade will handle related records)
    await prisma.store.delete({
      where: { id: storeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
  }
}
