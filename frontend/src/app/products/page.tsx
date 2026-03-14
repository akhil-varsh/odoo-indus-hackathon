"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiRequest, getToken } from '@/lib/api';

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  reorderRule: number;
  perUnitCost: number;
  totalStock: number;
};

type Location = { id: string; name: string };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: '',
    unitOfMeasure: 'units',
    perUnitCost: 0,
    reorderRule: 0,
    initialStock: 0,
    initialLocationId: '',
  });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Please login first.');
      return;
    }

    try {
      const [productData, locationData] = await Promise.all([
        apiRequest<Product[]>(`/products?search=${encodeURIComponent(search)}`, { token }),
        apiRequest<Location[]>('/locations?type=INTERNAL', { token }),
      ]);
      setProducts(productData);
      setLocations(locationData);
      if (locationData.length && !form.initialLocationId) {
        setForm((old) => ({ ...old, initialLocationId: locationData[0].id }));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load products');
    }
  }, [search, form.initialLocationId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    const token = getToken();
    if (!token) return;
    try {
      await apiRequest('/products', {
        method: 'POST',
        token,
        body: JSON.stringify(form),
      });
      setForm({
        sku: '',
        name: '',
        category: '',
        unitOfMeasure: 'units',
        perUnitCost: 0,
        reorderRule: 0,
        initialStock: 0,
        initialLocationId: form.initialLocationId,
      });
      setError('');
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create product');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-black text-slate-900">Products</h1>
        <p className="mt-2 text-sm text-slate-600">Create and update products with category, UOM, reorder rules, and stock.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Create Product</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
          <input className="rounded-lg border p-2" placeholder="SKU / Code" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <input className="rounded-lg border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="rounded-lg border p-2" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className="rounded-lg border p-2" placeholder="Unit of Measure" value={form.unitOfMeasure} onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })} />
          <input className="rounded-lg border p-2" placeholder="Per Unit Cost" type="number" value={form.perUnitCost} onChange={(e) => setForm({ ...form, perUnitCost: Number(e.target.value) })} />
          <input className="rounded-lg border p-2" placeholder="Reorder Rule" type="number" value={form.reorderRule} onChange={(e) => setForm({ ...form, reorderRule: Number(e.target.value) })} />
          <input className="rounded-lg border p-2" placeholder="Initial Stock" type="number" value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: Number(e.target.value) })} />
          <select className="rounded-lg border p-2" value={form.initialLocationId} onChange={(e) => setForm({ ...form, initialLocationId: e.target.value })}>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
          <button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white md:col-span-2" type="submit">Submit</button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Product List</h2>
          <input
            className="rounded-lg border p-2"
            placeholder="Search by name or SKU"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2">SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Per Unit Cost</th>
                <th>On Hand</th>
                <th>Reorder Rule</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-slate-800">{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.perUnitCost}</td>
                  <td>{p.totalStock}</td>
                  <td>{p.reorderRule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
