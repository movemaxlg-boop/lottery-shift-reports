
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET settings for a specific store
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const userId = (session.user as any).id;

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

    // Get or create settings for this store
    let settings = await prisma.storeSettings.findUnique({
      where: { storeId },
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          storeId,
          morningStart: '06:00',
          morningEnd: '14:00',
          afternoonStart: '14:00',
          afternoonEnd: '22:00',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT update settings for a specific store (managers only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      storeId,
      sheetsId,
      sheetName,
      morningStart,
      morningEnd,
      afternoonStart,
      afternoonEnd,
    } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const userId = (session.user as any).id;

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

    // Update or create settings
    const settings = await prisma.storeSettings.upsert({
      where: { storeId },
      update: {
        sheetsId,
        sheetName,
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
      },
      create: {
        storeId,
        sheetsId,
        sheetName: sheetName || 'Sheet1',
        morningStart: morningStart || '06:00',
        morningEnd: morningEnd || '14:00',
        afternoonStart: afternoonStart || '14:00',
        afternoonEnd: afternoonEnd || '22:00',
      },
    });

    return NextResponse.json({ 
      success: true,
      settings,
      message: 'Settings saved successfully.' 
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
