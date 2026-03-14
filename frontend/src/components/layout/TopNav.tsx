"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CircleUserRound, LogOut, UserRound } from "lucide-react";
import { apiRequest, clearToken, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Operations", href: "/operations" },
  { label: "About", href: "/about" },
  { label: "Move History", href: "/moves" },
  { label: "Settings", href: "/settings" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    apiRequest<Profile>("/auth/me", { token })
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const onLogout = () => {
    clearToken();
    setOpen(false);
    router.push("/auth");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="relative" ref={menuRef}>
          <Button variant="outline" size="icon" onClick={() => setOpen((prev) => !prev)}>
            <CircleUserRound />
          </Button>

          {open && (
            <Card className="absolute right-0 mt-2 w-72 border border-slate-200 bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound size={16} />
                  My Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">{profile?.name || "Unknown User"}</p>
                <p className="text-xs text-slate-600">{profile?.email || "No email"}</p>
                <p className="text-xs text-slate-500">Role: {profile?.role || "-"}</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { setOpen(false); router.push('/profile'); }}>
                    View
                  </Button>
                  <Button variant="destructive" size="sm" onClick={onLogout}>
                    <LogOut size={14} /> Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </nav>
    </header>
  );
}
