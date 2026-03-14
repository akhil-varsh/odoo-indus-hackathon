export default function DeliveryPage() {
  const deliveries = [
    { ref: 'WH/OUT/0001', to: 'Client A', contact: 'Sam', scheduled: '2026-03-16', status: 'Waiting' },
    { ref: 'WH/OUT/0002', to: 'Client B', contact: 'Lina', scheduled: '2026-03-18', status: 'Draft' },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-bold">Delivery</h1>
          <p className="text-gray-500">Outbound inventory workflow and list view.</p>
        </div>
        <button className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">+ New Delivery</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <tr>
              <th className="py-2">Reference</th>
              <th className="py-2">To</th>
              <th className="py-2">Contact</th>
              <th className="py-2">Scheduled</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.ref} className="border-b border-gray-100 hover:bg-slate-50">
                <td className="py-2">{d.ref}</td>
                <td className="py-2">{d.to}</td>
                <td className="py-2">{d.contact}</td>
                <td className="py-2">{d.scheduled}</td>
                <td className="py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
