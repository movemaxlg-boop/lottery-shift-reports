
# Google Sheets Setup Guide

## Overview
The application now uses **public Google Sheets** for data import. This eliminates the need for API credentials and service accounts.

## Setup Instructions

### 1. Prepare Your Google Sheet

1. **Create or Open Your Google Sheet**
   - Go to [Google Sheets](https://sheets.google.com/)
   - Create a new spreadsheet or open an existing one

2. **Make the Sheet Public**
   - Click the "Share" button (top-right corner)
   - Click "Change to anyone with the link"
   - Set permission to "Viewer"
   - Click "Copy link"

3. **Extract the Sheet ID**
   - Your link looks like: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
   - Copy the **SHEET_ID** (the long string between `/d/` and `/edit`)
   - Example: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 2. Configure in the Application

1. **Login to the Application**
   - Use your manager credentials
   - Navigate to Settings page

2. **Enter Google Sheets Configuration**
   - **Google Sheets ID**: Paste the Sheet ID you copied
   - **Sheet Name**: Enter the tab/sheet name (default is "Sheet1")

3. **Test the Connection**
   - Click the "Test Connection" button
   - You should see a success message with the number of rows found
   - If it fails, check:
     - The sheet is public (anyone with link can view)
     - The Sheet ID is correct
     - The sheet name matches the tab name in your spreadsheet

4. **Save Settings**
   - Click "Save All Settings" to apply the changes

### 3. Sheet Format

Your Google Sheet should follow this format:

```
Row 1: Store Name/Header
Row 2: Morning Shift | Afternoon Shift
Row 3: Headers (Slot, Game, Pack, Price, Start, End, Diff, Subtotal)
Row 4+: Data rows
```

**Example:**

| Morning Shift |        |      |       |       |     |      |          | Afternoon Shift |        |      |       |       |     |      |          |
|---------------|--------|------|-------|-------|-----|------|----------|-----------------|--------|------|-------|-------|-----|------|----------|
| Slot          | Game   | Pack | Price | Start | End | Diff | Subtotal | Slot            | Game   | Pack | Price | Start | End | Diff | Subtotal |
| 1             | ABC123 | 001  | 2.00  | 001   | 100 | 100  | 200.00   | 1               | XYZ789 | 002  | 5.00  | 001   | 050 | 50   | 250.00   |

### 4. Using Multiple Sheets

You can organize your data in multiple ways:

#### Option A: Date-Named Sheets
- Create a sheet for each date with the name in `YYYY-MM-DD` format
- Example: `2024-01-15`, `2024-01-16`, etc.
- The app will automatically try to load the sheet matching the selected date

#### Option B: Single Sheet with All Data
- Keep all data in one sheet (e.g., "Sheet1")
- Include a date column to filter data

### 5. Troubleshooting

**Connection Failed?**
- ✓ Make sure the sheet is public (Share → Anyone with the link → Viewer)
- ✓ Double-check the Sheet ID (no extra characters or spaces)
- ✓ Verify the sheet name matches exactly (case-sensitive)
- ✓ Try opening the sheet in an incognito browser to verify public access

**No Data Showing?**
- ✓ Check the sheet format matches the expected structure
- ✓ Ensure there's data in the rows
- ✓ Verify the date format if using date-named sheets

**Empty Results?**
- ✓ The sheet might be empty
- ✓ Check if you're looking at the correct date
- ✓ Verify the sheet name in settings matches your spreadsheet

## Benefits of Public Sheets

✅ **No API Setup Required** - No need for Google Cloud Console or service accounts
✅ **Simple Configuration** - Just copy and paste the Sheet ID
✅ **Easy Sharing** - Anyone with manager access can update the sheet ID
✅ **No Quotas** - No API rate limits to worry about
✅ **Works Immediately** - Test connection button provides instant feedback

## Security Note

While the sheet is "public", it's only accessible to people with the link. The Sheet ID is essentially a password. Keep it secure and don't share it publicly.

If you need more security:
- Only share the sheet with specific Google accounts
- Use "restricted" sharing instead of "anyone with the link"
- Regularly rotate sheet IDs by creating new copies

## Example Sheet ID

Here's what a Sheet ID looks like:
```
1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

And the full URL:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
```

---

Need help? Contact your system administrator or refer to the main README.md file.
