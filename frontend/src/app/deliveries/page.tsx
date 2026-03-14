"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest, getToken } from "@/lib/api";

type Delivery = {
  id: string;
  reference: string;
  customer?: string;
  status: string;
  createdAt: string;
  movements: Array<{
    id: string;
    product: { name: string };
    fromLocation?: { name: string } | null;
    toLocation?: { name: string } | null;
    quantity: number;
  }>;
};

type DeliveryResponse = {
  data: Delivery[];
  total: number;
  page: number;
};

type Product = { id: string; name: string };
type Location = { id: string; name: string };

export default function DeliveriesPage() {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    reference: "",
    customer: "",
    fromLocationId: "",
    productId: "",
    demandQty: 1,
  });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError("Please login first.");
      return;
    }

    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (status) query.set("status", status);

    try {
      const [list, productData, locationData] = await Promise.all([
        apiRequest<DeliveryResponse>(`/deliveries?${query.toString()}`, { token }),
        apiRequest<Product[]>("/products", { token }),
        apiRequest<Location[]>("/locations?type=INTERNAL", { token }),
      ]);

      setRows(list.data);
      setProducts(productData);
      setLocations(locationData);

      if (productData.length && !form.productId) {
        setForm((old) => ({ ...old, productId: productData[0].id }));
      }
      if (locationData.length && !form.fromLocationId) {
        setForm((old) => ({ ...old, fromLocationId: locationData[0].id }));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load deliveries");
    }
  }, [search, status, form.productId, form.fromLocationId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const createDelivery = async (event: FormEvent) => {
    event.preventDefault();
    const token = getToken();
    if (!token) return;

    try {
      await apiRequest("/deliveries", {
        method: "POST",
        token,
        body: JSON.stringify({
          reference: form.reference,
          customer: form.customer,
          fromLocationId: form.fromLocationId,
          lines: [{ productId: form.productId, demandQty: form.demandQty }],
        }),
      });
      setForm((old) => ({ ...old, reference: "", customer: "", demandQty: 1 }));
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create delivery");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-black">Deliveries</h1>
        <p className="text-sm text-slate-600">Reference | From | To | Product | Schedule Date | Status</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">New Delivery</h2>
        <form className="mt-3 grid gap-2 md:grid-cols-5" onSubmit={createDelivery}>
          <input className="rounded border px-3 py-2" placeholder="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <input className="rounded border px-3 py-2" placeholder="Customer" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
          <select className="rounded border px-3 py-2" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="rounded border px-3 py-2" value={form.fromLocationId} onChange={(e) => setForm({ ...form, fromLocationId: e.target.value })}>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input className="w-24 rounded border px-3 py-2" type="number" value={form.demandQty} onChange={(e) => setForm({ ...form, demandQty: Number(e.target.value) })} />
            <button className="rounded bg-blue-600 px-3 py-2 text-white" type="submit">Create</button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-3 flex gap-2">
          <input className="rounded border px-3 py-2" placeholder="Search reference/contact" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="rounded border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING">Waiting</option>
            <option value="READY">Ready</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2">Reference</th>
                <th>From</th>
                <th>To</th>
                <th>Product</th>
                <th>Schedule Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-blue-700"><Link href={`/deliveries/${row.id}`}>{row.reference || row.id}</Link></td>
                  <td>{row.movements[0]?.fromLocation?.name || "-"}</td>
                  <td>{row.movements[0]?.toLocation?.name || "-"}</td>
                  <td>{row.movements[0]?.product?.name || "-"}</td>
                  <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="font-semibold">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
