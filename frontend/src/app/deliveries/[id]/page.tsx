"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { apiRequest, getToken } from "@/lib/api";

type DeliveryStatus = "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";

type DeliveryDetail = {
  id: string;
  reference?: string | null;
  customer?: string | null;
  status: DeliveryStatus;
  notes?: string | null;
  movements: Array<{
    id: string;
    productId: string;
    quantity: number;
    fromLocationId?: string | null;
    product: { id: string; name: string; sku?: string | null };
  }>;
};

type Product = { id: string; name: string; sku?: string | null };
type Location = { id: string; name: string };
type Profile = { id: string; name: string; role: string };
type StockRow = {
  productId: string;
  locationId: string;
  freeToShip: number;
};

type EditableLine = {
  localId: string;
  productId: string;
  quantity: number;
  stockIssue?: boolean;
};

type NotePayload = {
  deliveryAddress?: string;
  scheduleDate?: string;
  responsible?: string;
  operationType?: string;
  notes?: string;
};

function parseNotes(raw: string | null | undefined): NotePayload {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as NotePayload;
  } catch {
    return { notes: raw };
  }
}

function statusStepClass(status: string, step: string) {
  if (status === step) return "bg-emerald-600 text-white";
  return "border border-emerald-300 text-emerald-700";
}

export default function DeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const token = useMemo(() => getToken(), []);

  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [responsibleName, setResponsibleName] = useState("Current User");
  const [error, setError] = useState("");
  const [alert, setAlert] = useState("");
  const [openEditor, setOpenEditor] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    reference: "",
    deliveryAddress: "",
    scheduleDate: "",
    responsible: "",
    operationType: "STANDARD",
    fromLocationId: "",
    notes: "",
  });
  const [lines, setLines] = useState<EditableLine[]>([]);

  const load = useCallback(async () => {
    if (!token || !params.id) return;

    try {
      const [data, productData, locationData, profile] = await Promise.all([
        apiRequest<DeliveryDetail>(`/deliveries/${params.id}`, { token }),
        apiRequest<Product[]>("/products", { token }),
        apiRequest<Location[]>("/locations?type=INTERNAL", { token }),
        apiRequest<Profile>("/auth/me", { token }),
      ]);

      setDelivery(data);
      setProducts(productData);
      setLocations(locationData);
      setResponsibleName(profile.name || "Current User");

      const parsedNotes = parseNotes(data.notes);
      const initialFromLocation = data.movements[0]?.fromLocationId || locationData[0]?.id || "";

      setForm({
        reference: data.reference || "WH/OUT/0001",
        deliveryAddress: parsedNotes.deliveryAddress || data.customer || "",
        scheduleDate: parsedNotes.scheduleDate || "",
        responsible: parsedNotes.responsible || profile.name || "",
        operationType: parsedNotes.operationType || "STANDARD",
        fromLocationId: initialFromLocation,
        notes: parsedNotes.notes || "",
      });

      setLines(
        data.movements.map((m, idx) => ({
          localId: `${m.id}-${idx}`,
          productId: m.productId,
          quantity: m.quantity,
          stockIssue: false,
        }))
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load delivery details");
    }
  }, [params.id, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const onValidate = async () => {
    if (!token || !params.id) return;
    setBusy(true);
    setError("");

    try {
      await apiRequest(`/deliveries/${params.id}/validate`, { method: "PUT", token });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to validate delivery");
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    if (!token || !params.id) return;
    setBusy(true);
    setError("");

    try {
      await apiRequest(`/deliveries/${params.id}/cancel`, { method: "PUT", token });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel delivery");
    } finally {
      setBusy(false);
    }
  };

  const addNewProductRow = () => {
    const defaultProductId = products[0]?.id || "";
    setLines((prev) => [
      ...prev,
      { localId: `new-${Date.now()}-${prev.length}`, productId: defaultProductId, quantity: 1, stockIssue: false },
    ]);
  };

  const updateLine = (localId: string, patch: Partial<EditableLine>) => {
    setLines((prev) => prev.map((line) => (line.localId === localId ? { ...line, ...patch } : line)));
  };

  const saveEdits = async () => {
    if (!token || !params.id) return;

    const cleanedLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (!cleanedLines.length) {
      setError("At least one product row is required.");
      return;
    }

    setBusy(true);
    setError("");
    setAlert("");

    try {
      const stockResults = await Promise.all(
        cleanedLines.map((line) => apiRequest<StockRow[]>(`/stock?productId=${line.productId}`, { token }))
      );

      let hasOutOfStock = false;
      const nextLines = cleanedLines.map((line, idx) => {
        const locationStock = stockResults[idx].find((s) => s.locationId === form.fromLocationId);
        const free = locationStock?.freeToShip ?? 0;
        const stockIssue = free < line.quantity;
        if (stockIssue) hasOutOfStock = true;
        return { ...line, stockIssue };
      });

      setLines(nextLines);

      const nextStatus: DeliveryStatus = hasOutOfStock ? "WAITING" : "READY";
      if (hasOutOfStock) {
        setAlert("One or more products are not in stock. Delivery moved to Waiting.");
      }

      const notePayload: NotePayload = {
        deliveryAddress: form.deliveryAddress,
        scheduleDate: form.scheduleDate,
        responsible: form.responsible || responsibleName,
        operationType: form.operationType,
        notes: form.notes,
      };

      await apiRequest(`/deliveries/${params.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          reference: form.reference,
          customer: form.deliveryAddress,
          notes: JSON.stringify(notePayload),
          status: nextStatus,
          fromLocationId: form.fromLocationId,
          lines: nextLines.map((line) => ({
            productId: line.productId,
            quantity: Number(line.quantity),
          })),
        }),
      });

      setOpenEditor(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save delivery updates");
    } finally {
      setBusy(false);
    }
  };

  const current = delivery?.status || "DRAFT";

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-full border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          onClick={() => router.push("/deliveries")}
        >
          New
        </button>
        <h1 className="text-3xl font-black text-slate-900">Delivery</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onValidate}
            disabled={busy || current === "DONE" || current === "CANCELED"}
            className="rounded-full border border-slate-400 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
          >
            Validate
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-slate-400 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Print
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy || current === "DONE" || current === "CANCELED"}
            className="rounded-full border border-slate-400 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold uppercase">
          <span className={`rounded-full px-3 py-1 ${statusStepClass(current, "DRAFT")}`}>Draft</span>
          <span className={`rounded-full px-3 py-1 ${statusStepClass(current, "WAITING")}`}>Waiting</span>
          <span className={`rounded-full px-3 py-1 ${statusStepClass(current, "READY")}`}>Ready</span>
          <span className={`rounded-full px-3 py-1 ${statusStepClass(current, "DONE")}`}>Done</span>
          <button
            type="button"
            onClick={() => setOpenEditor(true)}
            className="ml-1 inline-flex items-center gap-1 rounded-full border border-emerald-300 px-3 py-2 text-[11px] font-bold tracking-wide text-emerald-700 hover:bg-emerald-50"
            title="Edit Delivery"
          >
            <Pencil size={14} />
            Edit
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {alert && <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">{alert}</p>}

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-sm text-slate-500">Reference</p>
        <p className="font-semibold text-slate-900">{delivery?.reference || "WH/OUT/0001"}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2 text-right">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {delivery?.movements.map((m) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="px-3 py-2">[{m.product.sku || "SKU"}] {m.product.name}</td>
                <td className="px-3 py-2 text-right">{m.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-emerald-200 bg-white p-6 text-slate-800 shadow-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                onClick={() => router.push("/deliveries")}
              >
                New
              </button>
              <h2 className="text-3xl font-extrabold tracking-wide text-slate-900">Delivery</h2>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onValidate}
                  disabled={busy || delivery?.status === "DONE" || delivery?.status === "CANCELED"}
                  className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                >
                  Validate
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={busy || delivery?.status === "DONE" || delivery?.status === "CANCELED"}
                  className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              <div className="flex items-center gap-1 text-xs uppercase">
                <span className={`rounded-full px-3 py-1 ${statusStepClass(delivery?.status || "DRAFT", "DRAFT")}`}>Draft</span>
                <span className={`rounded-full px-3 py-1 ${statusStepClass(delivery?.status || "DRAFT", "WAITING")}`}>Waiting</span>
                <span className={`rounded-full px-3 py-1 ${statusStepClass(delivery?.status || "DRAFT", "READY")}`}>Ready</span>
                <span className={`rounded-full px-3 py-1 ${statusStepClass(delivery?.status || "DRAFT", "DONE")}`}>Done</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs uppercase">Reference</label>
                <input
                  value={form.reference || "WH/OUT/0001"}
                  readOnly
                  className="mt-1 w-full border-b border-emerald-300 bg-transparent pb-2 text-slate-900 outline-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase">Delivery Address</label>
                  <input
                    value={form.deliveryAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                    className="mt-1 w-full border-b border-emerald-300 bg-transparent pb-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase">Schedule Date</label>
                  <input
                    type="date"
                    value={form.scheduleDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, scheduleDate: e.target.value }))}
                    className="mt-1 w-full border-b border-emerald-300 bg-transparent pb-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase">Responsible</label>
                  <input
                    value={form.responsible || responsibleName}
                    onChange={(e) => setForm((prev) => ({ ...prev, responsible: e.target.value }))}
                    className="mt-1 w-full border-b border-emerald-300 bg-transparent pb-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase">Operation Type</label>
                  <div className="mt-1 flex items-center border-b border-emerald-300 pb-2">
                    <select
                      value={form.operationType}
                      onChange={(e) => setForm((prev) => ({ ...prev, operationType: e.target.value }))}
                      className="w-full bg-transparent outline-none"
                    >
                      <option value="STANDARD">STANDARD</option>
                      <option value="EXPRESS">EXPRESS</option>
                      <option value="RETURN">RETURN</option>
                    </select>
                    <span className="text-xs">▽</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase">Source Location</label>
                  <div className="mt-1 flex items-center border-b border-emerald-300 pb-2">
                    <select
                      value={form.fromLocationId}
                      onChange={(e) => setForm((prev) => ({ ...prev, fromLocationId: e.target.value }))}
                      className="w-full bg-transparent outline-none"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs">▽</span>
                  </div>
                </div>
              </div>

              <hr className="border-emerald-200" />
              <h3 className="text-lg font-bold text-slate-900">Products</h3>

              <div className="overflow-x-auto rounded-xl border border-emerald-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => {
                      const selectedProduct = products.find((p) => p.id === line.productId);
                      return (
                        <tr key={line.localId} className={`border-t border-emerald-100 ${line.stockIssue ? "bg-red-50" : ""}`}>
                          <td className="px-3 py-2">
                            <select
                              value={line.productId}
                              onChange={(e) => updateLine(line.localId, { productId: e.target.value })}
                              className="w-full bg-transparent outline-none"
                            >
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  [{product.sku || "SKU"}] {product.name}
                                </option>
                              ))}
                            </select>
                            {!selectedProduct && <p className="text-xs text-red-300">New Product</p>}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min={1}
                              value={line.quantity}
                              onChange={(e) => updateLine(line.localId, { quantity: Number(e.target.value || 0) })}
                              className="w-20 border-b border-emerald-300 bg-transparent text-right outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addNewProductRow}
                className="inline-flex items-center gap-1 text-sm font-semibold underline hover:opacity-90"
              >
                <Plus size={14} /> Add New Product
              </button>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenEditor(false)}
                className="rounded-full border border-emerald-300 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={saveEdits}
                disabled={busy}
                className="rounded-full border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
