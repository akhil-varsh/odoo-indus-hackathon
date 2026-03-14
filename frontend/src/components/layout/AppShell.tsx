"use client";

import { usePathname } from "next/navigation";
import TopNav from "./TopNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) {
    return <main className="min-h-screen bg-slate-100">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <TopNav />
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
