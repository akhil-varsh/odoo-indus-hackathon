import React from "react";

export default function ProductsPage() {
  const products = [
    {
      sku: "PR-200",
      name: "Plastic Housing",
      category: "Packaged Goods",
      stock: 430,
      reorder: 120,
    },
    {
      sku: "RM-101",
      name: "Steel Rod",
      category: "Raw Material",
      stock: 11,
      reorder: 20,
    },
    {
      sku: "EL-208",
      name: "Sensor Board",
      category: "Electronics",
      stock: 52,
      reorder: 30,
    },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-500">
            Manage product catalog and stock entries.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50">
            Import CSV
          </button>
          <button className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">
            + Add Product
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wide">
                <th className="py-2">SKU</th>
                <th className="py-2">Name</th>
                <th className="py-2">Category</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Reorder</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr
                  key={item.sku}
                  className="border-b border-gray-100 hover:bg-slate-50"
                >
                  <td className="py-2 font-medium">{item.sku}</td>
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">{item.category}</td>
                  <td className="py-2">{item.stock}</td>
                  <td className="py-2">{item.reorder}</td>
                  <td className="py-2">
                    <button className="text-blue-600 hover:underline">
                      Edit
                    </button>
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
