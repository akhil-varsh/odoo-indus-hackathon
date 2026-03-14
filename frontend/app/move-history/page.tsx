export default function MoveHistoryPage() {
  const moves = [
    { id: 'M-201', ref: 'WH/IN/0001', contact: 'John', scheduled: '2026-03-14', status: 'Done' },
    { id: 'M-202', ref: 'WH/OUT/0001', contact: 'Sam', scheduled: '2026-03-16', status: 'Waiting' },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-bold">Move History</h1>
          <p className="text-gray-500">Track all inventory movements and statuses.</p>
        </div>
        <button className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">Filter</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <tr>
              <th className="py-2">Move ID</th>
              <th className="py-2">Reference</th>
              <th className="py-2">Contact</th>
              <th className="py-2">Scheduled</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {moves.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 hover:bg-slate-50">
                <td className="py-2">{m.id}</td>
                <td className="py-2">{m.ref}</td>
                <td className="py-2">{m.contact}</td>
                <td className="py-2">{m.scheduled}</td>
                <td className="py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{m.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
