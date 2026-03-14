"use client";

import { useEffect, useState } from "react";
import { apiRequest, getToken } from "@/lib/api";

type MoveRow = {
  id: string;
  datetime: string;
  reference: string;
  fromLocation: string | null;
  toLocation: string | null;
  product: string;
  price: number;
  qty: number;
  status: string;
};

type MoveResponse = {
  data: MoveRow[];
  total: number;
  page: number;
};

export default function MovesPage() {
  const [moves, setMoves] = useState<MoveRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("Please login first.");
      return;
    }

    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (status) query.set("status", status);

    apiRequest<MoveResponse>(`/moves?${query.toString()}`, { token })
      .then((response) => setMoves(response.data))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Failed to load moves"));
  }, [search, status]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-black">Move History</h1>
        <div className="flex gap-2">
          <input
            className="rounded border px-3 py-2"
            placeholder="Search by reference/contact"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="rounded border px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING">Waiting</option>
            <option value="READY">Ready</option>
            <option value="DONE">Done</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>
      </div>

      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2">Date/Time</th>
              <th>From</th>
              <th>To</th>
              <th>Product</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {moves.map((move) => (
              <tr key={move.id} className="border-b border-slate-100">
                <td className="py-2">{new Date(move.datetime).toLocaleString()}</td>
                <td>{move.fromLocation || "-"}</td>
                <td>{move.toLocation || "-"}</td>
                <td className={search ? "font-semibold text-emerald-700" : "font-semibold"}>{move.product}</td>
                <td>{move.price}</td>
                <td>{move.qty}</td>
                <td className="font-bold">{move.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
