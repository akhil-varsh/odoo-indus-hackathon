"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, Home, LogOut, Package, Settings, UserRound, Warehouse } from 'lucide-react';
import { clearToken } from '@/lib/api';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/operations', label: 'Operations', icon: Activity },
  { href: '/moves', label: 'Move History', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/settings', label: 'Warehouse', icon: Warehouse },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push('/auth');
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-slate-800 bg-slate-900 text-slate-100 lg:flex">
      <div className="border-b border-slate-800 p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Core Inventory</p>
        <h1 className="mt-2 text-2xl font-black">CoreInventory</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                isActive ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-slate-800 p-4">
        <Link href="/profile" className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-800">
          <UserRound size={18} />
          My Profile
        </Link>
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-red-600">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
