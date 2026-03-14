export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Products', value: '1,234' },
          { title: 'Low Stock Items', value: '23', text: 'text-red-500' },
          { title: 'Pending Receipts', value: '8' },
          { title: 'Pending Deliveries', value: '12' },
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.title}</h3>
            <p className={`text-3xl font-bold ${stat.text ?? ''}`}>{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <p className="text-gray-500">Activity list will go here.</p>
      </div>
    </div>
  );
}
