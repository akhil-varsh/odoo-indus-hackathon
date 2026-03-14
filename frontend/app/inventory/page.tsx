export default function InventoryPage() {
  const locations = [
    { location: "Warehouse A", onHand: 1290, allocated: 220, available: 1070 },
    { location: "Warehouse B", onHand: 950, allocated: 90, available: 860 },
    { location: "Main Store", onHand: 430, allocated: 65, available: 365 },
  ];

  const stockMovements = [
    {
      id: "M-001",
      item: "Steel Rod",
      type: "Increase",
      qty: 150,
      date: "2026-03-11",
    },
    {
      id: "M-002",
      item: "Sensor Board",
      type: "Decrease",
      qty: 30,
      date: "2026-03-12",
    },
    {
      id: "M-003",
      item: "Plastic Housing",
      type: "Increase",
      qty: 180,
      date: "2026-03-13",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-gray-500">
            Track stock levels and movement across locations.
          </p>
        </div>
        <button className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">
          + Adjust Stock
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        {locations.map((loc) => (
          <div
            key={loc.location}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                {loc.location}
              </p>
              <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                Active
              </span>
            </div>
            <div className="mt-3 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>On Hand</span>
                <span className="font-semibold">{loc.onHand}</span>
              </div>
              <div className="flex justify-between">
                <span>Allocated</span>
                <span className="font-semibold">{loc.allocated}</span>
              </div>
              <div className="flex justify-between">
                <span>Available</span>
                <span className="font-semibold">{loc.available}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Recent Stock Movements</h2>
          <span className="text-xs text-gray-500">Showing last 7 days</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wide text-xs">
                <th className="py-2">Ref</th>
                <th className="py-2">Item</th>
                <th className="py-2">Type</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {stockMovements.map((movement) => (
                <tr
                  key={movement.id}
                  className="border-b border-gray-100 hover:bg-slate-50"
                >
                  <td className="py-2 font-medium">{movement.id}</td>
                  <td className="py-2">{movement.item}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${movement.type === "Increase" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                    >
                      {movement.type}
                    </span>
                  </td>
                  <td className="py-2">{movement.qty}</td>
                  <td className="py-2">{movement.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
