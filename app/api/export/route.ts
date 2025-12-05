
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    let date = new Date();
    if (dateParam) {
      date = new Date(dateParam);
    }
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const shifts = await prisma.shift.findMany({
      where: {
        date: {
          gte: date,
          lt: nextDay,
        },
      },
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
        { shiftType: 'asc' },
      ],
    });

    // Build CSV content
    let csv = 'Shift Type,Cashier,Slot,Game ID,Game Name,Pack,Price Per Ticket,Start Ticket,End Ticket,Difference,Subtotal\n';

    for (const shift of shifts) {
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
      
      for (const item of Object.values(slotData)) {
        const data: any = item;
        const start = parseInt(data.startTicket || '0', 10);
        const end = parseInt(data.endTicket || '0', 10);
        const difference = end - start;
        const subtotal = difference * data.game.pricePerTicket;
        
        csv += `${shift.shiftType},${shift.cashier.firstName} ${shift.cashier.lastName},${data.slot},${data.game.gameId},${data.game.gameName},${data.game.packNumber || 'N/A'},${data.game.pricePerTicket},${data.startTicket || 'N/A'},${data.endTicket || 'N/A'},${difference},${subtotal.toFixed(2)}\n`;
      }
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="shift-report-${date.toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
