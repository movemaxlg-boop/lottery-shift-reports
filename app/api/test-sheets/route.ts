
import { NextRequest, NextResponse } from 'next/server';
import { testGoogleSheetsConnection } from '@/lib/googleSheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sheetsId, sheetName } = await req.json();

    if (!sheetsId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Sheet ID is required' 
      }, { status: 400 });
    }

    const result = await testGoogleSheetsConnection(sheetsId, sheetName || 'Sheet1');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to test connection' 
    }, { status: 500 });
  }
}
