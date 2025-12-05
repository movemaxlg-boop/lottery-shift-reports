
# Lottery Shift Reports

A professional web application for viewing and managing lottery ticket shift reports.

## 🔐 Login Credentials

The application uses hardcoded credentials for authentication:

### Manager Account
- **Email:** manager@lottery.com
- **Password:** manager123
- **Access:** Full access to all settings and reports

### Cashier Account
- **Email:** cashier@lottery.com
- **Password:** cashier123
- **Access:** View-only access to reports

## ✨ Features

### Core Functionality
- **Side-by-side shift reports** - View morning and afternoon shifts simultaneously
- **Date selection** - Browse reports for any date
- **Cashier search** - Filter reports by cashier name
- **CSV export** - Download reports for offline analysis
- **Real-time calculations** - Automatic ticket sales and revenue calculations

### Advanced Features
- **Google Sheets Integration** - Connect to your Google Sheets for live data sync
- **New Pack Detection** - Automatically highlights newly added packs with light green background
- **Theft Detection** - Alerts for negative ticket differences
- **Configurable Store Settings** - Customize store name, address, and contact info
- **Flexible Shift Times** - Adjust shift start/end times per store requirements

## 🚀 Getting Started

1. **Login** - Use the credentials above to access the system
2. **Configure Settings** (Manager only)
   - Go to Settings page
   - Enter store information
   - Set up Google Sheets connection (optional)
   - Adjust shift times as needed
3. **View Reports** - Select a date and view shift reports

## 🔧 Google Sheets Setup

To connect your Google Sheets data:

1. **Create a Google Cloud Project**
   - Visit: https://console.cloud.google.com/
   - Create a new project

2. **Enable Google Sheets API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Sheets API" and enable it

3. **Create Service Account**
   - Go to "Credentials" → "Create Credentials" → "Service Account"
   - Give it a descriptive name
   - Grant "Editor" or "Viewer" role

4. **Generate JSON Key**
   - Click on the created service account
   - Go to "Keys" → "Add Key" → "Create new key"
   - Choose JSON format and download

5. **Extract Credentials**
   - Open the downloaded JSON file
   - Copy `client_email` → Paste as **Service Account Email**
   - Copy `private_key` → Paste as **Private Key**
   - Get your Google Sheets ID from the URL: `docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`

6. **Share Your Sheet**
   - Open your Google Sheet
   - Click "Share"
   - Add the service account email with "Viewer" or "Editor" access

7. **Save Settings**
   - Enter all credentials in the Settings page
   - Click "Save All Settings"

## 📊 Data Format

The application expects Google Sheets data in the following format:

```
Row 1: Store Name
Row 2: Morning Shift | Afternoon Shift
Row 3: Headers (Slot, Game, Pack, Price, Start, End, Diff, Subtotal) | Headers
Row 4+: Data rows
```

### Example:
```
Lucky Lottery Store

Morning Shift          |  Afternoon Shift
Cashier: Sarah         |  Cashier: Lizda
Time: 6:00 AM          |  Time: 2:00 PM

Slot Game Pack Price Start End Diff Subtotal | Slot Game Pack Price Start End Diff Subtotal
1    1234 7891 $5    015   025  10   $50      | 1    1234 7891 $5    025   027  2    $10
2    5678 1234 $10   001   015  14   $140     | 2    5678 1234 $10   015   021  6    $60
```

## 🎨 Visual Indicators

- **Light Green Row** - Newly added pack (first time appearing)
- **Green "NEW" Badge** - Indicates a pack that wasn't in the previous shift
- **Red Badge** - Negative difference (potential theft alert)
- **Yellow Alert** - System detected discrepancies requiring attention

## 🛠️ Technical Details

- **Framework:** Next.js 14 with TypeScript
- **Authentication:** NextAuth.js with hardcoded credentials
- **Database:** PostgreSQL (via Prisma)
- **External Integration:** Google Sheets API
- **Styling:** Tailwind CSS + shadcn/ui components

## 📝 Notes

- **Settings Persistence:** Google Sheets credentials should be set as environment variables for production use
- **New Pack Detection:** Compares current shift with previous shift to identify newly added packs
- **Shift Times:** Can be customized per store in Settings (Manager access required)
- **Data Source Priority:** System tries Google Sheets first, then falls back to database if unavailable

## 🔒 Security

- Authentication required for all pages
- Manager role required for settings modification
- Google Sheets credentials stored securely
- Session-based authentication with JWT tokens

## 📞 Support

For issues or questions, please contact your system administrator.
