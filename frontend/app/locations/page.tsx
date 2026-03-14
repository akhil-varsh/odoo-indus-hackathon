export default function LocationsPage() {
  const locations = [
    { code: 'A1', warehouse: 'Warehouse A' },
    { code: 'B2', warehouse: 'Warehouse A' },
    { code: 'ColdRoom', warehouse: 'Warehouse B' },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-gray-500">Map storage locations to warehouses.</p>
        </div>
        <button className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">+ New Location</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <tr>
              <th className="py-2">Code</th>
              <th className="py-2">Warehouse</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.code} className="border-b border-gray-100 hover:bg-slate-50">
                <td className="py-2 font-medium">{loc.code}</td>
                <td className="py-2">{loc.warehouse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
