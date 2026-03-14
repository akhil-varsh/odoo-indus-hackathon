"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest, getToken } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type SummaryResponse = {
  receipts: { total: number; pending: number };
  deliveries: { today: number; pending: number; operations: number };
};

type KpiResponse = {
  totalProductsInStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  internalTransfersScheduled: number;
};

type Activity = {
  id: string;
  quantity: number;
  status: string;
  product: { name: string };
  fromLocation?: { name: string } | null;
  toLocation?: { name: string } | null;
};

type StatsResponse = {
  from: string | null;
  to: string | null;
  receipts: number;
  deliveries: number;
  transfers: number;
  adjustments: number;
};

export default function DashboardPage() {
  const [date, setDate] = useState('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [kpis, setKpis] = useState<KpiResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Please login to continue.');
      return;
    }

    Promise.all([
      apiRequest<SummaryResponse>(`/dashboard/summary?date=${date}`, { token }),
      apiRequest<KpiResponse>('/dashboard/kpis', { token }),
      apiRequest<StatsResponse>(`/dashboard/stats?from=${from}&to=${to}`, { token }),
      apiRequest<Activity[]>('/dashboard/activity?limit=8', { token }),
    ])
      .then(([summaryData, kpiData, statsData, activityData]) => {
        setSummary(summaryData);
        setKpis(kpiData);
        setStats(statsData);
        setActivity(activityData);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard');
      });
  }, [date, from, to]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Inventory Dashboard</h1>
            <p className="text-sm text-slate-500">Live summary of receipts, deliveries, and stock status.</p>
          </div>
          <select
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="today">Today</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-emerald-600 text-white ring-0">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest">Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary?.receipts.pending ?? 0}</p>
            <p className="text-sm">to receive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-slate-500">Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{summary?.deliveries.today ?? 0}</p>
            <p className="text-sm text-slate-500">
            pending: {summary?.deliveries.pending ?? 0} | total operations: {summary?.deliveries.operations ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-slate-500">Stock Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{kpis?.totalProductsInStock ?? 0}</p>
            <p className="text-sm text-slate-500">products in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-slate-500">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {(kpis?.pendingReceipts ?? 0) + (kpis?.pendingDeliveries ?? 0)}
            </p>
            <p className="text-sm text-slate-500">receipt + delivery operations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">Quick Operations</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/receipts" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              Receipts
            </Link>
            <Link href="/deliveries" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Deliveries
            </Link>
            <Link href="/operations" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
              All Operations
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-600">
            Low Stock: {kpis?.lowStockItems ?? 0} | Out of Stock: {kpis?.outOfStockItems ?? 0} | Internal Transfers:
            {' '}
            {kpis?.internalTransfersScheduled ?? 0}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Date Range Stats - Receipts: {stats?.receipts ?? 0}, Deliveries: {stats?.deliveries ?? 0}, Transfers: {stats?.transfers ?? 0}, Adjustments: {stats?.adjustments ?? 0}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <ul className="mt-4 space-y-3">
            {activity.map((item) => (
              <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">{item.product.name} <Badge variant="outline">{item.status}</Badge></p>
                <p className="text-slate-600">
                  {item.fromLocation?.name || '-'} to {item.toLocation?.name || '-'} | Qty: {item.quantity}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
