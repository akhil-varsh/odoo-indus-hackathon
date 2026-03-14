export default function DashboardPage() {
  const summary = [
    { title: 'Total Products', value: '2,118', icon: '📦' },
    { title: 'Low Stock', value: '18', icon: '⚠️', color: 'text-red-500' },
    { title: 'Pending Receipts', value: '6', icon: '📥' },
    { title: 'Pending Deliveries', value: '12', icon: '🚚' },
  ];

  const lowStock = [
    { sku: 'RM-101', name: 'Steel Rod', stock: 11, location: 'Warehouse A' },
    { sku: 'PM-404', name: 'Pressure Seal', stock: 7, location: 'Warehouse B' },
    { sku: 'EL-208', name: 'Sensor Board', stock: 4, location: 'Warehouse A' },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">CoreInventory</p>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor stock levels, receipts, and deliveries in one place.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">Create Alert</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {summary.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">{item.title}</div>
                <div className={`mt-1 text-2xl font-bold ${item.color ?? 'text-slate-900'}`}>{item.value}</div>
              </div>
              <div className="text-3xl">{item.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Low Stock Items</h2>
          <button className="text-sm text-blue-600 underline">View full inventory</button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-left border-separate border-spacing-y-1">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <th className="py-2">SKU</th>
                <th className="py-2">Item</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Location</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((row) => (
                <tr key={row.sku} className="border-b border-gray-100 hover:bg-slate-50">
                  <td className="py-2 text-sm font-medium">{row.sku}</td>
                  <td className="py-2 text-sm">{row.name}</td>
                  <td className="py-2 text-sm text-red-600 font-semibold">{row.stock}</td>
                  <td className="py-2 text-sm">{row.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

