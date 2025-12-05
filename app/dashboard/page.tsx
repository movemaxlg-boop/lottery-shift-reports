
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { StoreSelector } from '@/components/store-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, Search, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface ShiftItem {
  slot: number;
  gameId: string;
  packNumber: string | null;
  pricePerTicket: number;
  startTicket: string;
  endTicket: string;
  difference: number;
  subtotal: number;
  isNew?: boolean; // Flag for newly added packs
}

interface ShiftReport {
  shiftId: string;
  cashierName: string;
  startTime: string;
  endTime: string | null;
  items: ShiftItem[];
  total: number;
}

interface ReportData {
  date: string;
  reports: {
    morning: ShiftReport | null;
    afternoon: ShiftReport | null;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession() || {};
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session && selectedStoreId) {
      fetchReports();
      fetchStore();
    }
  }, [selectedDate, searchQuery, selectedStoreId, status, session]);

  const fetchReports = async () => {
    if (!selectedStoreId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        storeId: selectedStoreId,
        ...(searchQuery && { cashier: searchQuery }),
      });
      
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  };

  const fetchStore = async () => {
    if (!selectedStoreId) return;
    
    try {
      const res = await fetch(`/api/stores/${selectedStoreId}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setStoreName(data?.store?.name || '');
    } catch (error) {
      // Silently handle errors
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/export?date=${selectedDate}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shift-report-${selectedDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const dailyTotal = (reportData?.reports?.morning?.total || 0) + (reportData?.reports?.afternoon?.total || 0);
  
  // Calculate if there are discrepancies (potential theft alerts)
  const hasDiscrepancies = reportData?.reports?.morning?.items?.some(item => item.difference < 0) ||
                          reportData?.reports?.afternoon?.items?.some(item => item.difference < 0);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {storeName || 'Select a Store'}
              </h1>
              <p className="text-slate-500 mt-1">Daily Shift Reports & Analysis</p>
            </div>
            
            <StoreSelector
              selectedStoreId={selectedStoreId}
              onStoreChange={setSelectedStoreId}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search cashier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 w-48"
              />
            </div>
            
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {!selectedStoreId && (
          <Card className="bg-blue-50 border-blue-200 shadow-md">
            <CardContent className="flex items-center gap-3 pt-6">
              <div>
                <p className="font-semibold text-blue-900">Welcome!</p>
                <p className="text-sm text-blue-700">Please select a store from the dropdown above to view reports.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Daily Total</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">${dailyTotal?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-slate-500 mt-2">Total sales for {format(new Date(selectedDate), 'MMM dd, yyyy')}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Morning Shift</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">${reportData?.reports?.morning?.total?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-slate-500 mt-2">{reportData?.reports?.morning?.cashierName || 'No data'}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Afternoon Shift</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">${reportData?.reports?.afternoon?.total?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-slate-500 mt-2">{reportData?.reports?.afternoon?.cashierName || 'No data'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert for discrepancies */}
        {hasDiscrepancies && (
          <Card className="bg-yellow-50 border-yellow-200 shadow-md">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-900">Potential Issue Detected</p>
                <p className="text-sm text-yellow-700">Negative ticket differences found. Please review the shift reports.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Side-by-Side Shift Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Morning Shift */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <span>Morning Shift</span>
                <Badge variant="secondary" className="bg-white text-blue-600">
                  {reportData?.reports?.morning?.startTime || '6:00 AM'} - {reportData?.reports?.morning?.endTime || '2:00 PM'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-blue-50">
                Cashier: {reportData?.reports?.morning?.cashierName || 'No data available'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : reportData?.reports?.morning ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">Slot</TableHead>
                        <TableHead className="font-semibold">Game</TableHead>
                        <TableHead className="font-semibold">Pack</TableHead>
                        <TableHead className="font-semibold text-right">Price</TableHead>
                        <TableHead className="font-semibold text-center">Start</TableHead>
                        <TableHead className="font-semibold text-center">End</TableHead>
                        <TableHead className="font-semibold text-center">Diff</TableHead>
                        <TableHead className="font-semibold text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.reports.morning.items?.map((item, index) => (
                        <TableRow 
                          key={index} 
                          className={`hover:bg-slate-50 ${item?.isNew ? 'bg-green-50' : ''}`}
                        >
                          <TableCell className="font-medium">{item?.slot}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">#{item?.gameId}</div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {item?.packNumber || 'N/A'}
                            {item?.isNew && (
                              <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-700 border-green-300">
                                NEW
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">${item?.pricePerTicket?.toFixed(2)}</TableCell>
                          <TableCell className="text-center text-sm">{item?.startTicket}</TableCell>
                          <TableCell className="text-center text-sm">{item?.endTicket}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={item?.difference < 0 ? 'destructive' : 'default'}>
                              {item?.difference}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">${item?.subtotal?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-blue-50 font-bold">
                        <TableCell colSpan={7} className="text-right">Total:</TableCell>
                        <TableCell className="text-right text-lg text-blue-700">
                          ${reportData.reports.morning.total?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">No morning shift data available</div>
              )}
            </CardContent>
          </Card>

          {/* Afternoon Shift */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <span>Afternoon Shift</span>
                <Badge variant="secondary" className="bg-white text-purple-600">
                  {reportData?.reports?.afternoon?.startTime || '2:00 PM'} - {reportData?.reports?.afternoon?.endTime || '10:00 PM'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-purple-50">
                Cashier: {reportData?.reports?.afternoon?.cashierName || 'No data available'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : reportData?.reports?.afternoon ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">Slot</TableHead>
                        <TableHead className="font-semibold">Game</TableHead>
                        <TableHead className="font-semibold">Pack</TableHead>
                        <TableHead className="font-semibold text-right">Price</TableHead>
                        <TableHead className="font-semibold text-center">Start</TableHead>
                        <TableHead className="font-semibold text-center">End</TableHead>
                        <TableHead className="font-semibold text-center">Diff</TableHead>
                        <TableHead className="font-semibold text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.reports.afternoon.items?.map((item, index) => (
                        <TableRow 
                          key={index} 
                          className={`hover:bg-slate-50 ${item?.isNew ? 'bg-green-50' : ''}`}
                        >
                          <TableCell className="font-medium">{item?.slot}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">#{item?.gameId}</div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {item?.packNumber || 'N/A'}
                            {item?.isNew && (
                              <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-700 border-green-300">
                                NEW
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">${item?.pricePerTicket?.toFixed(2)}</TableCell>
                          <TableCell className="text-center text-sm">{item?.startTicket}</TableCell>
                          <TableCell className="text-center text-sm">{item?.endTicket}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={item?.difference < 0 ? 'destructive' : 'default'}>
                              {item?.difference}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">${item?.subtotal?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-purple-50 font-bold">
                        <TableCell colSpan={7} className="text-right">Total:</TableCell>
                        <TableCell className="text-right text-lg text-purple-700">
                          ${reportData.reports.afternoon.total?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">No afternoon shift data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
