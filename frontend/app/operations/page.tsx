import React from "react";

export default function OperationsPage() {
  const operations = [
    {
      id: "R-1001",
      type: "Receipt",
      product: "Steel Rod",
      qty: 120,
      status: "Completed",
    },
    {
      id: "D-455",
      type: "Delivery",
      product: "Sensor Board",
      qty: 30,
      status: "In Transit",
    },
    {
      id: "R-1002",
      type: "Receipt",
      product: "Plastic Housing",
      qty: 200,
      status: "Pending",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-3xl font-bold">Operations</h1>
          <p className="text-gray-500">
            Track inventory movement and update status.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md px-3 py-2 border border-slate-300 hover:bg-slate-100">
            New Transfer
          </button>
          <button className="rounded-md bg-green-600 text-white px-3 py-2 hover:bg-green-700">
            New Receipt
          </button>
          <button className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">
            New Delivery
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Recent Operations</h2>
          <span className="text-xs text-gray-500">Updated 2 min ago</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wide text-xs">
                <th className="py-2">Ref</th>
                <th className="py-2">Type</th>
                <th className="py-2">Product</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((op) => (
                <tr
                  key={op.id}
                  className="border-b border-gray-100 hover:bg-slate-50"
                >
                  <td className="py-2 text-sm font-medium">{op.id}</td>
                  <td className="py-2 text-sm">{op.type}</td>
                  <td className="py-2 text-sm">{op.product}</td>
                  <td className="py-2 text-sm">{op.qty}</td>
                  <td className="py-2 text-sm">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        op.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : op.status === "In Transit"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {op.status}
                    </span>
                  </td>
                  <td className="py-2 text-sm text-blue-600 hover:underline cursor-pointer">
                    View
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
