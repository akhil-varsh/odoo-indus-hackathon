export default function AboutPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-slate-900">About CoreInventory</h1>
      <p className="mt-3 text-slate-600">
        CoreInventory digitizes stock operations for inventory managers and warehouse staff through centralized,
        real-time workflows.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
        <li>Incoming receipts and outgoing deliveries</li>
        <li>Internal transfers and inventory adjustments</li>
        <li>Warehouse and location-level visibility</li>
        <li>Move history and dashboard KPIs</li>
      </ul>
    </section>
  );
}
