"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getToken } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
  const router = useRouter();
  const [date, setDate] = useState('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [kpis, setKpis] = useState<KpiResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      const token = getToken();
      if (!token) {
        router.replace('/auth');
        return;
      }

      try {
        const me = await apiRequest<{ role: string }>('/auth/me', { token });
        const managerRole = me.role === 'ADMIN' || me.role === 'INVENTORY_MANAGER';
        setIsManager(managerRole);

        const requests: Array<Promise<unknown>> = [
          apiRequest<SummaryResponse>(`/dashboard/summary?date=${date}`, { token }),
          apiRequest<Activity[]>('/dashboard/activity?limit=8', { token }),
        ];

        if (managerRole) {
          requests.push(
            apiRequest<KpiResponse>('/dashboard/kpis', { token }),
            apiRequest<StatsResponse>(`/dashboard/stats?from=${from}&to=${to}`, { token })
          );
        }

        const result = await Promise.all(requests);
        const [summaryData, activityData, kpiData, statsData] = result;
        setSummary(summaryData as SummaryResponse);
        setActivity(activityData as Activity[]);
        setKpis((kpiData as KpiResponse | undefined) ?? null);
        setStats((statsData as StatsResponse | undefined) ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard');
      }
    };

    void run();
  }, [date, from, to, router]);

  const inventoryBarData = useMemo(
    () => [
      { name: 'In Stock', value: kpis?.totalProductsInStock ?? 0 },
      { name: 'Low Stock', value: kpis?.lowStockItems ?? 0 },
      { name: 'Out of Stock', value: kpis?.outOfStockItems ?? 0 },
    ],
    [kpis]
  );

  const timelineData = useMemo(() => {
    const receipts = stats?.receipts ?? summary?.receipts.total ?? 0;
    const deliveries = stats?.deliveries ?? summary?.deliveries.operations ?? 0;
    const transfers = stats?.transfers ?? 0;
    const adjustments = stats?.adjustments ?? 0;

    return [
      { label: 'Week 1', orders: Math.max(1, Math.floor(receipts * 0.2)), stockFlow: Math.max(1, Math.floor(deliveries * 0.2)) },
      { label: 'Week 2', orders: Math.max(1, Math.floor(receipts * 0.25)), stockFlow: Math.max(1, Math.floor(deliveries * 0.25)) },
      { label: 'Week 3', orders: Math.max(1, Math.floor(receipts * 0.27) + transfers), stockFlow: Math.max(1, Math.floor(deliveries * 0.27) + adjustments) },
      { label: 'Week 4', orders: Math.max(1, Math.ceil(receipts * 0.28)), stockFlow: Math.max(1, Math.ceil(deliveries * 0.28)) },
    ];
  }, [stats, summary]);

  const stockMixPieData = useMemo(
    () => [
      { name: 'Available', value: Math.max((kpis?.totalProductsInStock ?? 0) - (kpis?.lowStockItems ?? 0), 0) },
      { name: 'Low', value: kpis?.lowStockItems ?? 0 },
      { name: 'Out', value: kpis?.outOfStockItems ?? 0 },
    ],
    [kpis]
  );

  const revenuePieData = useMemo(
    () => [
      { name: 'Deliveries', value: 48000 },
      { name: 'Receipts', value: 25000 },
      { name: 'Services', value: 17000 },
      { name: 'Other', value: 10000 },
    ],
    []
  );

  const PIE_COLORS = ['#059669', '#34d399', '#10b981', '#a7f3d0'];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Inventory Dashboard</h1>
            <p className="text-sm text-slate-500">
              {isManager
                ? 'Live summary of receipts, deliveries, and stock status.'
                : 'Execution dashboard for warehouse receipts, deliveries, and activity.'}
            </p>
          </div>
          <select
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="today">Today</option>
          </select>
          {isManager && (
            <>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
            </>
          )}
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

        {isManager && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-slate-500">Stock Health</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{kpis?.totalProductsInStock ?? 0}</p>
              <p className="text-sm text-slate-500">products in stock</p>
            </CardContent>
          </Card>
        )}

        {isManager && (
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
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Inventory Analytics</h2>
          <p className="text-sm text-slate-500">2x2 charts: inventory, stocks, orders timeline, revenue split</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700">Inventory Status (Bar)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#334155', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700">Orders Timeline (Line)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fill: '#334155', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#334155', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="stockFlow" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700">Stock Mix (Pie)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockMixPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {stockMixPieData.map((entry, index) => (
                      <Cell key={`stock-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700">Revenue Split (Mock Pie)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenuePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                    {revenuePieData.map((entry, index) => (
                      <Cell key={`revenue-${entry.name}`} fill={PIE_COLORS[(index + 1) % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

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
          {isManager && (
            <>
              <p className="mt-5 text-sm text-slate-600">
                Low Stock: {kpis?.lowStockItems ?? 0} | Out of Stock: {kpis?.outOfStockItems ?? 0} | Internal Transfers:
                {' '}
                {kpis?.internalTransfersScheduled ?? 0}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Date Range Stats - Receipts: {stats?.receipts ?? 0}, Deliveries: {stats?.deliveries ?? 0}, Transfers: {stats?.transfers ?? 0}, Adjustments: {stats?.adjustments ?? 0}
              </p>
            </>
          )}
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
