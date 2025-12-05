
interface SheetRow {
  slot: string;
  gameId: string;
  packNumber: string;
  price: string;
  startTicket: string;
  endTicket: string;
}

interface ShiftData {
  cashierName: string;
  time: string;
  rows: SheetRow[];
}

interface StoreSettings {
  sheetsId?: string | null;
  sheetName?: string | null;
}

export async function getGoogleSheetsData(date: string, settings?: StoreSettings | null) {
  try {
    const sheetsId = settings?.sheetsId || process.env.SHEETS_ID;
    const sheetName = settings?.sheetName || 'Sheet1';

    if (!sheetsId) {
      console.log('Google Sheets ID not configured');
      return null;
    }

    // Format date to match sheet name or range
    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD

    // Fetch data from public Google Sheet using CSV export
    // First try with date as sheet name
    let csvUrl = `https://docs.google.com/spreadsheets/d/${sheetsId}/gviz/tq?tqx=out:csv&sheet=${formattedDate}`;
    
    let response = await fetch(csvUrl);
    
    // If date sheet doesn't exist, try the default sheet
    if (!response.ok) {
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetsId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      response = await fetch(csvUrl);
    }

    if (!response.ok) {
      console.log('Failed to fetch Google Sheets data');
      return null;
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (!rows || rows.length === 0) {
      return null;
    }

    return parseSheetData(rows, date);
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return null;
  }
}

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Simple CSV parsing (handles quoted values)
    const row: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    row.push(currentValue.trim());
    rows.push(row);
  }
  
  return rows;
}

function parseSheetData(rows: any[][] | null | undefined, date: string) {
  if (!rows || rows.length === 0) {
    return null;
  }

  // Expected format:
  // Row 1: Store name
  // Row 2: Headers for Morning shift | Headers for Afternoon shift
  // Row 3: Slot, Game, Pack, Price, Start, End, Diff, Subtotal | Slot, Game, Pack, Price, Start, End, Diff, Subtotal
  // Row 4+: Data rows

  const result = {
    morning: null as any,
    afternoon: null as any,
  };

  try {
    // Find header rows
    let morningStartCol = 0;
    let afternoonStartCol = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Look for "Morning" and "Afternoon" indicators
      if (row.some((cell: string) => cell?.toLowerCase().includes('morning'))) {
        morningStartCol = row.findIndex((cell: string) => cell?.toLowerCase().includes('slot'));
        
        // Find afternoon section (usually right after morning)
        const afternoonIdx = row.findIndex((cell: string) => cell?.toLowerCase().includes('afternoon'));
        if (afternoonIdx > 0) {
          afternoonStartCol = afternoonIdx;
        }
        
        // Parse shift data starting from next row
        if (i + 2 < rows.length) {
          result.morning = parseShiftSection(rows, i + 2, morningStartCol, 'Morning');
          if (afternoonStartCol > 0) {
            result.afternoon = parseShiftSection(rows, i + 2, afternoonStartCol, 'Afternoon');
          }
        }
        break;
      }
    }

    return result;
  } catch (error) {
    console.error('Error parsing sheet data:', error);
    return null;
  }
}

function parseShiftSection(rows: any[][], startRow: number, colOffset: number, shiftName: string) {
  const items = [];
  let cashierName = '';
  let total = 0;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    
    // Check if this is a total row
    if (row[colOffset]?.toLowerCase()?.includes('total')) {
      break;
    }

    // Check if this row has cashier name
    if (row[colOffset]?.toLowerCase()?.includes('cashier')) {
      cashierName = row[colOffset + 1] || '';
      continue;
    }

    // Parse data row
    const slot = row[colOffset];
    const gameId = row[colOffset + 1];
    const packNumber = row[colOffset + 2];
    const price = parseFloat(row[colOffset + 3]?.toString().replace(/[$,]/g, '') || '0');
    const startTicket = row[colOffset + 4];
    const endTicket = row[colOffset + 5];
    const diff = parseInt(row[colOffset + 6] || '0', 10);
    const subtotal = parseFloat(row[colOffset + 7]?.toString().replace(/[$,]/g, '') || '0');

    if (slot && gameId) {
      items.push({
        slot: parseInt(slot, 10),
        gameId,
        packNumber: packNumber || null,
        pricePerTicket: price,
        startTicket,
        endTicket,
        difference: diff,
        subtotal,
      });
      total += subtotal;
    }
  }

  return {
    shiftId: `${shiftName}-${Date.now()}`,
    cashierName: cashierName || 'Unknown',
    startTime: shiftName === 'Morning' ? '06:00 AM' : '02:00 PM',
    endTime: shiftName === 'Morning' ? '02:00 PM' : '10:00 PM',
    items,
    total,
  };
}

export async function testGoogleSheetsConnection(sheetsId?: string, sheetName?: string) {
  try {
    const sheetId = sheetsId || process.env.SHEETS_ID;
    const sheet = sheetName || 'Sheet1';

    if (!sheetId) {
      return { success: false, error: 'Sheet ID not configured' };
    }

    // Test connection by trying to fetch the sheet as CSV
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheet}`;
    const response = await fetch(csvUrl);

    if (!response.ok) {
      return { 
        success: false, 
        error: 'Failed to access sheet. Make sure the sheet is public and the ID is correct.' 
      };
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    return { 
      success: true, 
      message: `Successfully connected! Found ${rows.length} rows.`,
      rowCount: rows.length
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Connection failed' 
    };
  }
}
