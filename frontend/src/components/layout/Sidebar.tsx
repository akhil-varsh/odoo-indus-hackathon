import Link from 'next/link';
import { Home, Package, Activity, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 text-2xl font-bold border-b border-gray-800">CoreInventory</div>
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition-colors">
          <Home size={20} /> Dashboard
        </Link>
        <Link href="/products" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition-colors">
          <Package size={20} /> Products
        </Link>
        <Link href="/operations" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition-colors">
          <Activity size={20} /> Operations
        </Link>
        <Link href="/settings" className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition-colors">
          <Settings size={20} /> Settings
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center gap-3 p-3 w-full rounded hover:bg-red-600 transition-colors">
          <LogOut size={20} /> Logout
        </button>
      </div>
    </aside>
  );
}
