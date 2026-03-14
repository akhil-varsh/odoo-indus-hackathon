import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../src/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'CoreInventory',
  description: 'Inventory Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 text-sm text-slate-700">
              <a href="/dashboard" className="rounded-md px-2 py-1 hover:bg-slate-100">Dashboard</a>
              <a href="/operations" className="rounded-md px-2 py-1 hover:bg-slate-100">Operations</a>
              <a href="/products" className="rounded-md px-2 py-1 hover:bg-slate-100">Products</a>
              <a href="/move-history" className="rounded-md px-2 py-1 hover:bg-slate-100">Move History</a>
              <a href="/settings" className="rounded-md px-2 py-1 hover:bg-slate-100">Settings</a>
            </div>
          </header>
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
