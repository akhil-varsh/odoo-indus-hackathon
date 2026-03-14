export default function ReceiptsPage() {
  const receipts = [
    { ref: 'WH/IN/0001', from: 'Acme Supplier', contact: 'John', scheduled: '2026-03-14', status: 'Ready' },
    { ref: 'WH/IN/0002', from: 'Delta Parts', contact: 'May', scheduled: '2026-03-15', status: 'Draft' },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-bold">Receipts</h1>
          <p className="text-gray-500">Inbound inventory workflow and list view.</p>
        </div>
        <button className="rounded-md bg-green-600 text-white px-3 py-2 hover:bg-green-700">+ New Receipt</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <tr>
              <th className="py-2">Reference</th>
              <th className="py-2">From</th>
              <th className="py-2">Contact</th>
              <th className="py-2">Scheduled</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => (
              <tr key={r.ref} className="border-b border-gray-100 hover:bg-slate-50">
                <td className="py-2">{r.ref}</td>
                <td className="py-2">{r.from}</td>
                <td className="py-2">{r.contact}</td>
                <td className="py-2">{r.scheduled}</td>
                <td className="py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
