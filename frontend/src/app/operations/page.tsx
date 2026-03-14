import Link from 'next/link';

const cards = [
  { title: 'Receipts', href: '/receipts', desc: 'Incoming stock from vendors' },
  { title: 'Deliveries', href: '/deliveries', desc: 'Outgoing shipments to customers' },
  { title: 'Inventory Adjustment', href: '/operations?type=ADJUSTMENT', desc: 'Correct mismatched stock counts' },
  { title: 'Move History', href: '/moves', desc: 'Audit all stock movements' },
  { title: 'Dashboard', href: '/dashboard', desc: 'Operations summary and KPIs' },
  { title: 'Setting - Warehouse', href: '/settings', desc: 'Warehouse and location configuration' },
];

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-black text-slate-900">Operations</h1>
        <p className="mt-2 text-slate-600">
          Manage receipts, deliveries, transfers, adjustments, and movement visibility from a single module.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
