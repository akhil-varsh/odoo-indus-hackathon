import React from 'react';

export default function ProductsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">+ Add Product</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-gray-500 font-medium">SKU</th>
              <th className="pb-3 text-gray-500 font-medium">Name</th>
              <th className="pb-3 text-gray-500 font-medium">Category</th>
              <th className="pb-3 text-gray-500 font-medium">Stock</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3">ST-001</td>
              <td className="py-3">Steel Rods</td>
              <td className="py-3">Raw Material</td>
              <td className="py-3 font-semibold">500 units</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
