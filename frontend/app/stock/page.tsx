export default function StockPage() {
  const stock = [
    { product: 'Beef', cost: '$2.20', onHand: 120, freeToUse: 95 },
    { product: 'Milk', cost: '$1.10', onHand: 230, freeToUse: 200 },
    { product: 'Steel Rod', cost: '$4.50', onHand: 64, freeToUse: 50 },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-bold">Stock</h1>
          <p className="text-gray-500">View product costs, on-hand, and available stock.</p>
        </div>
        <button className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">+ Update Stock</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <tr>
              <th className="py-2">Product</th>
              <th className="py-2">Per Unit Cost</th>
              <th className="py-2">On Hand</th>
              <th className="py-2">Free to Use</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((r) => (
              <tr key={r.product} className="border-b border-gray-100 hover:bg-slate-50">
                <td className="py-2 font-medium">{r.product}</td>
                <td className="py-2">{r.cost}</td>
                <td className="py-2">{r.onHand}</td>
                <td className="py-2">{r.freeToUse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
