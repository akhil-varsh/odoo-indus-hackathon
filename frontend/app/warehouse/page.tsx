export default function WarehousePage() {
  const warehouses = [
    { code: 'WH-A', name: 'Warehouse A', address: '123 Industrial Rd, City' },
    { code: 'WH-B', name: 'Warehouse B', address: '45 Distribution Ave, City' },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-bold">Warehouses</h1>
          <p className="text-gray-500">Define physical warehouses and addresses.</p>
        </div>
        <button className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">+ New Warehouse</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <tr>
              <th className="py-2">Code</th>
              <th className="py-2">Name</th>
              <th className="py-2">Address</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((wh) => (
              <tr key={wh.code} className="border-b border-gray-100 hover:bg-slate-50">
                <td className="py-2 font-medium">{wh.code}</td>
                <td className="py-2">{wh.name}</td>
                <td className="py-2">{wh.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
