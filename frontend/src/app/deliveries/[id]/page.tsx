"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest, getToken } from "@/lib/api";

type DeliveryDetail = {
  id: string;
  reference?: string;
  status: string;
  notes?: string | null;
  movements: Array<{
    id: string;
    quantity: number;
    product: { name: string };
  }>;
};

export default function DeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const data = await apiRequest<DeliveryDetail>(`/deliveries/${params.id}`, { token });
      setDelivery(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load delivery");
    }
  };

  useEffect(() => {
    if (params.id) {
      load();
    }
  }, [params.id]);

  const changeStatus = async (action: "validate" | "cancel") => {
    const token = getToken();
    if (!token) return;

    try {
      await apiRequest(`/deliveries/${params.id}/${action}`, {
        method: "PUT",
        token,
      });
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Failed to ${action}`);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Delivery {delivery?.reference || params.id}</h1>
        <div className="flex gap-2">
          <button className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => changeStatus("validate")}>Validate</button>
          <button className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => changeStatus("cancel")}>Cancel</button>
          <button className="rounded bg-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => window.print()}>Print</button>
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-700">Draft &gt; Ready &gt; Done | Current: {delivery?.status}</p>
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Scheduled Date</p>
          <p className="font-semibold">{new Date().toLocaleDateString()}</p>
        </article>
        <article className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Responsible</p>
          <p className="font-semibold">Current Logged In User</p>
        </article>
        <article className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Delivery Type</p>
          <p className="font-semibold">Standard</p>
        </article>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-bold">Products</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2">Product</th>
              <th>Demand Qty</th>
            </tr>
          </thead>
          <tbody>
            {delivery?.movements.map((movement) => (
              <tr key={movement.id} className="border-b border-slate-100">
                <td className="py-2">{movement.product.name}</td>
                <td>{movement.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white" onClick={() => router.push('/deliveries')}>
        Back to Deliveries
      </button>
    </section>
  );
}
