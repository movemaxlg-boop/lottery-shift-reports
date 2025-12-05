
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { StoreSelector } from '@/components/store-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Store, Save, User, Database, Clock } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession() || {};
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  
  // Google Sheets settings
  const [sheetsId, setSheetsId] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  
  // Shift time settings
  const [morningStart, setMorningStart] = useState('06:00');
  const [morningEnd, setMorningEnd] = useState('14:00');
  const [afternoonStart, setAfternoonStart] = useState('14:00');
  const [afternoonEnd, setAfternoonEnd] = useState('22:00');
  
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [message, setMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');

  const isManager = (session?.user as any)?.role === 'manager';

  useEffect(() => {
    if (session && selectedStoreId) {
      fetchStore();
      fetchSettings();
    }
  }, [session, selectedStoreId]);

  const fetchStore = async () => {
    if (!selectedStoreId) return;
    
    try {
      const res = await fetch(`/api/stores/${selectedStoreId}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setStoreName(data?.store?.name || '');
      setAddress(data?.store?.address || '');
      setPhone(data?.store?.phone || '');
    } catch (error) {
      // Silently handle errors
    }
  };

  const fetchSettings = async () => {
    if (!selectedStoreId) return;
    
    try {
      const res = await fetch(`/api/settings?storeId=${selectedStoreId}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setSheetsId(data?.sheetsId || '');
      setSheetName(data?.sheetName || 'Sheet1');
      setMorningStart(data?.morningStart || '06:00');
      setMorningEnd(data?.morningEnd || '14:00');
      setAfternoonStart(data?.afternoonStart || '14:00');
      setAfternoonEnd(data?.afternoonEnd || '22:00');
    } catch (error) {
      // Silently handle errors
    }
  };

  const handleSave = async () => {
    if (!selectedStoreId) {
      setMessage('Please select a store first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Save store info
      const storeRes = await fetch(`/api/stores/${selectedStoreId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: storeName, address, phone }),
      });

      // Save settings
      const settingsRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStoreId,
          sheetsId,
          sheetName,
          morningStart,
          morningEnd,
          afternoonStart,
          afternoonEnd,
        }),
      });

      if (storeRes.ok && settingsRes.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!sheetsId) {
      setTestMessage('Please enter a Google Sheets ID first');
      return;
    }

    setTestingConnection(true);
    setTestMessage('');

    try {
      const res = await fetch('/api/test-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetsId, sheetName }),
      });

      const data = await res.json();

      if (data.success) {
        setTestMessage(`✓ ${data.message || 'Connection successful!'}`);
      } else {
        setTestMessage(`✗ ${data.error || 'Connection failed'}`);
      }

      setTimeout(() => setTestMessage(''), 5000);
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestMessage('✗ An error occurred while testing');
      setTimeout(() => setTestMessage(''), 5000);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500 mt-1">Manage your store and account settings</p>
          </div>
          <StoreSelector
            selectedStoreId={selectedStoreId}
            onStoreChange={setSelectedStoreId}
          />
        </div>

        {!selectedStoreId && (
          <Card className="bg-blue-50 border-blue-200 shadow-md">
            <CardContent className="flex items-center gap-3 pt-6">
              <div>
                <p className="font-semibold text-blue-900">Welcome!</p>
                <p className="text-sm text-blue-700">Please select a store from the dropdown above to configure settings.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Info Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-500">Name</Label>
                <p className="font-medium mt-1">{session?.user?.name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-slate-500">Email</Label>
                <p className="font-medium mt-1">{session?.user?.email || 'N/A'}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm text-slate-500">Role</Label>
              <div className="mt-1">
                <Badge variant={(session?.user as any)?.role === 'manager' ? 'default' : 'secondary'}>
                  {((session?.user as any)?.role || 'cashier')?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Configuration Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Configuration
            </CardTitle>
            <CardDescription>
              {isManager 
                ? 'Configure your store information' 
                : 'View store information (Manager access required to edit)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.includes('success') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={!isManager || loading}
                placeholder="Enter store name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!isManager || loading}
                placeholder="Enter store address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isManager || loading}
                placeholder="(555) 123-4567"
              />
            </div>

            {!isManager && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
                Only managers can modify store settings
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Connection Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Google Sheets Connection
            </CardTitle>
            <CardDescription>
              {isManager 
                ? 'Connect to a public Google Sheet for data sync' 
                : 'View Google Sheets connection (Manager access required to edit)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testMessage && (
              <div className={`p-3 rounded-md text-sm ${
                testMessage.includes('✓') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {testMessage}
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
              <strong>Setup Instructions:</strong>
              <ol className="list-decimal ml-4 mt-2 space-y-1">
                <li>Open your Google Sheet</li>
                <li>Click "Share" → "Anyone with the link" → "Viewer" → "Copy link"</li>
                <li>Extract the Sheet ID from the URL (the long string after /d/)</li>
                <li>Paste it below and test the connection</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheetsId">Google Sheets ID</Label>
              <Input
                id="sheetsId"
                value={sheetsId}
                onChange={(e) => setSheetsId(e.target.value)}
                disabled={!isManager || loading}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              />
              <p className="text-xs text-slate-500">
                Found in the URL: docs.google.com/spreadsheets/d/<strong>SHEETS_ID</strong>/edit
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheetName">Sheet Name</Label>
              <Input
                id="sheetName"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                disabled={!isManager || loading}
                placeholder="Sheet1"
              />
              <p className="text-xs text-slate-500">
                The name of the tab/sheet within your spreadsheet (default is "Sheet1")
              </p>
            </div>

            {isManager && (
              <Button
                onClick={handleTestConnection}
                disabled={testingConnection || !sheetsId}
                variant="outline"
                className="w-full"
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            )}

            {!isManager && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
                Only managers can modify Google Sheets settings
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shift Time Configuration */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Shift Time Configuration
            </CardTitle>
            <CardDescription>
              {isManager 
                ? 'Configure shift times for your store' 
                : 'View shift times (Manager access required to edit)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-slate-700">Morning Shift</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="morningStart">Start Time</Label>
                  <Input
                    id="morningStart"
                    type="time"
                    value={morningStart}
                    onChange={(e) => setMorningStart(e.target.value)}
                    disabled={!isManager || loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="morningEnd">End Time</Label>
                  <Input
                    id="morningEnd"
                    type="time"
                    value={morningEnd}
                    onChange={(e) => setMorningEnd(e.target.value)}
                    disabled={!isManager || loading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-slate-700">Afternoon Shift</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="afternoonStart">Start Time</Label>
                  <Input
                    id="afternoonStart"
                    type="time"
                    value={afternoonStart}
                    onChange={(e) => setAfternoonStart(e.target.value)}
                    disabled={!isManager || loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="afternoonEnd">End Time</Label>
                  <Input
                    id="afternoonEnd"
                    type="time"
                    value={afternoonEnd}
                    onChange={(e) => setAfternoonEnd(e.target.value)}
                    disabled={!isManager || loading}
                  />
                </div>
              </div>
            </div>

            {!isManager && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
                Only managers can modify shift times
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        {isManager && (
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="gap-2 px-8"
              size="lg"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
