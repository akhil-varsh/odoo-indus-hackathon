"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest, getToken } from "@/lib/api";

type Warehouse = {
  id: string;
  name: string;
  shortCode: string;
  address?: string;
};

type Location = {
  id: string;
  name: string;
  shortCode?: string;
  warehouseId?: string;
};

type StockRow = {
  id: string;
  productId: string;
  product: string;
  perUnitCost: number;
  onHand: number;
  freeToShip: number;
  locationId: string;
};

export default function SettingsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [productFilter, setProductFilter] = useState("");
  const [error, setError] = useState("");

  const [warehouseForm, setWarehouseForm] = useState({ name: "", shortCode: "", address: "" });
  const [locationForm, setLocationForm] = useState({ name: "", shortCode: "", warehouseId: "" });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError("Please login first.");
      return;
    }

    try {
      const [wData, lData, sData] = await Promise.all([
        apiRequest<Warehouse[]>("/warehouses", { token }),
        apiRequest<Location[]>("/locations", { token }),
        apiRequest<StockRow[]>(
          `/stock${productFilter ? `?productId=${encodeURIComponent(productFilter)}` : ""}`,
          { token },
        ),
      ]);
      setWarehouses(wData);
      setLocations(lData);
      setStockRows(sData);
      if (wData.length && !locationForm.warehouseId) {
        setLocationForm((old) => ({ ...old, warehouseId: wData[0].id }));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load settings data");
    }
  }, [productFilter, locationForm.warehouseId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const createWarehouse = async (event: FormEvent) => {
    event.preventDefault();
    const token = getToken();
    if (!token) return;
    try {
      await apiRequest("/warehouses", {
        method: "POST",
        token,
        body: JSON.stringify(warehouseForm),
      });
      setWarehouseForm({ name: "", shortCode: "", address: "" });
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create warehouse");
    }
  };

  const createLocation = async (event: FormEvent) => {
    event.preventDefault();
    const token = getToken();
    if (!token) return;
    try {
      await apiRequest("/locations", {
        method: "POST",
        token,
        body: JSON.stringify({ ...locationForm, type: "INTERNAL" }),
      });
      setLocationForm((old) => ({ ...old, name: "", shortCode: "" }));
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create location");
    }
  };

  const updateStock = async (row: StockRow, onHand: number, perUnitCost: number) => {
    const token = getToken();
    if (!token) return;
    try {
      await apiRequest(`/stock/${row.productId}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          locationId: row.locationId,
          onHand,
          perUnitCost,
        }),
      });
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update stock");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-black text-slate-900">Settings</h1>
        <p className="mt-2 text-sm text-slate-600">Warehouse, location, and stock controls.</p>
      </section>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Warehouse</h2>
          <form className="mt-4 grid gap-3" onSubmit={createWarehouse}>
            <input className="rounded-lg border p-2" placeholder="Name" value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} />
            <input className="rounded-lg border p-2" placeholder="Short Code" value={warehouseForm.shortCode} onChange={(e) => setWarehouseForm({ ...warehouseForm, shortCode: e.target.value })} />
            <input className="rounded-lg border p-2" placeholder="Address" value={warehouseForm.address} onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })} />
            <button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white" type="submit">Save Warehouse</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {warehouses.map((warehouse) => (
              <li key={warehouse.id} className="rounded bg-slate-50 p-3">
                <p className="font-semibold">{warehouse.name} ({warehouse.shortCode})</p>
                <p className="text-slate-500">{warehouse.address || "No address"}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Location</h2>
          <form className="mt-4 grid gap-3" onSubmit={createLocation}>
            <input className="rounded-lg border p-2" placeholder="Name" value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} />
            <input className="rounded-lg border p-2" placeholder="Short Code" value={locationForm.shortCode} onChange={(e) => setLocationForm({ ...locationForm, shortCode: e.target.value })} />
            <select className="rounded-lg border p-2" value={locationForm.warehouseId} onChange={(e) => setLocationForm({ ...locationForm, warehouseId: e.target.value })}>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
            <button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" type="submit">Save Location</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {locations.map((location) => (
              <li key={location.id} className="rounded bg-slate-50 p-3">
                <p className="font-semibold">{location.name} ({location.shortCode || '-'})</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold">Stock</h2>
          <input
            className="rounded-lg border p-2"
            placeholder="Filter by productId"
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Product</th>
                <th>Per Unit Cost</th>
                <th>On Hand</th>
                <th>Free to Ship</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stockRows.map((row) => (
                <StockEditorRow key={row.id} row={row} onSave={updateStock} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StockEditorRow({
  row,
  onSave,
}: {
  row: StockRow;
  onSave: (row: StockRow, onHand: number, perUnitCost: number) => Promise<void>;
}) {
  const [onHand, setOnHand] = useState(row.onHand);
  const [perUnitCost, setPerUnitCost] = useState(row.perUnitCost);

  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 font-semibold">{row.product}</td>
      <td>
        <input className="w-24 rounded border px-2 py-1" type="number" value={perUnitCost} onChange={(e) => setPerUnitCost(Number(e.target.value))} />
      </td>
      <td>
        <input className="w-24 rounded border px-2 py-1" type="number" value={onHand} onChange={(e) => setOnHand(Number(e.target.value))} />
      </td>
      <td>{row.freeToShip}</td>
      <td>
        <button className="rounded bg-emerald-600 px-3 py-1 text-white" onClick={() => onSave(row, onHand, perUnitCost)}>
          Update
        </button>
      </td>
    </tr>
  );
}
