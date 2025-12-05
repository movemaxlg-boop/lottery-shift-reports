
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGoogleSheetsData } from '@/lib/googleSheets';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Helper function to detect new packs
function markNewPacks(currentReport: any, previousReport: any) {
  if (!currentReport || !previousReport) {
    return currentReport;
  }

  const previousPacks = new Set(
    previousReport.items?.map((item: any) => `${item.gameId}-${item.packNumber}`)
  );

  if (currentReport.items) {
    currentReport.items = currentReport.items.map((item: any) => ({
      ...item,
      isNew: !previousPacks.has(`${item.gameId}-${item.packNumber}`),
    }));
  }

  return currentReport;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const cashierName = searchParams.get('cashier');
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

    let date = new Date();
    if (dateParam) {
      date = new Date(dateParam);
    }
    date.setHours(0, 0, 0, 0);

    // Get store settings for Google Sheets configuration
    const storeSettings = await prisma.storeSettings.findUnique({
      where: { storeId },
    });

    // Try to fetch from Google Sheets first if configured
    let sheetsData = null;
    if (storeSettings?.sheetsId) {
      sheetsData = await getGoogleSheetsData(
        dateParam || date.toISOString().split('T')[0],
        storeSettings
      );
    }
    
    if (sheetsData) {
      // Filter by cashier name if provided
      let reports = sheetsData;
      
      if (cashierName && reports) {
        if (reports.morning && !reports.morning.cashierName.toLowerCase().includes(cashierName.toLowerCase())) {
          reports.morning = null;
        }
        if (reports.afternoon && !reports.afternoon.cashierName.toLowerCase().includes(cashierName.toLowerCase())) {
          reports.afternoon = null;
        }
      }

      // Get previous day's data to mark new packs
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevSheetsData = await getGoogleSheetsData(
        prevDate.toISOString().split('T')[0],
        storeSettings
      );

      // Mark new packs in afternoon shift by comparing with morning
      if (reports.afternoon && reports.morning) {
        reports.afternoon = markNewPacks(reports.afternoon, reports.morning);
      }

      // Mark new packs in morning shift by comparing with previous day's afternoon
      if (reports.morning && prevSheetsData?.afternoon) {
        reports.morning = markNewPacks(reports.morning, prevSheetsData.afternoon);
      }

      return NextResponse.json({
        date: date.toISOString(),
        reports,
        source: 'google_sheets',
      });
    }

    // Fallback to database if Google Sheets not available
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Build where clause
    const where: any = {
      storeId,
      date: {
        gte: date,
        lt: nextDay,
      },
    };

    // Add cashier filter if provided
    if (cashierName) {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: cashierName, mode: 'insensitive' } },
            { lastName: { contains: cashierName, mode: 'insensitive' } },
          ],
        },
      });
      
      if (users.length > 0) {
        where.cashierId = { in: users.map(u => u.id) };
      }
    }

    // Get shifts with related data
    const shifts = await prisma.shift.findMany({
      where,
      include: {
        cashier: true,
        scans: {
          include: {
            slot: {
              include: {
                game: true,
              },
            },
          },
          orderBy: {
            scannedAt: 'asc',
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { shiftType: 'asc' },
      ],
    });

    // Process shifts into report format
    const reports = {
      morning: null as any,
      afternoon: null as any,
    };

    for (const shift of shifts) {
      const shiftType = shift.shiftType;
      
      // Group scans by slot
      const slotData: any = {};
      
      for (const scan of shift.scans) {
        const slotNumber = scan.slot.slotNumber;
        
        if (!slotData[slotNumber]) {
          slotData[slotNumber] = {
            slot: slotNumber,
            game: scan.slot.game,
            startTicket: null,
            endTicket: null,
          };
        }
        
        if (scan.scanType === 'start') {
          slotData[slotNumber].startTicket = scan.ticketNumber;
        } else if (scan.scanType === 'end') {
          slotData[slotNumber].endTicket = scan.ticketNumber;
        }
      }
      
      // Calculate differences and subtotals
      const items = Object.values(slotData).map((item: any) => {
        const start = parseInt(item.startTicket || '0', 10);
        const end = parseInt(item.endTicket || '0', 10);
        const difference = end - start;
        const subtotal = difference * item.game.pricePerTicket;
        
        return {
          slot: item.slot,
          gameId: item.game.gameId,
          packNumber: item.game.packNumber,
          pricePerTicket: item.game.pricePerTicket,
          startTicket: item.startTicket,
          endTicket: item.endTicket,
          difference,
          subtotal,
        };
      });
      
      const total = items.reduce((sum, item) => sum + item.subtotal, 0);
      
      reports[shiftType as 'morning' | 'afternoon'] = {
        shiftId: shift.id,
        cashierName: `${shift.cashier.firstName} ${shift.cashier.lastName}`,
        startTime: shift.startTime,
        endTime: shift.endTime,
        items,
        total,
      };
    }

    // Mark new packs from database data
    if (reports.afternoon && reports.morning) {
      reports.afternoon = markNewPacks(reports.afternoon, reports.morning);
    }

    return NextResponse.json({
      date: date.toISOString(),
      reports,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
