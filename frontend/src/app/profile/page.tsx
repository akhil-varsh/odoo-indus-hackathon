"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, getToken } from "@/lib/api";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/auth');
      return;
    }

    apiRequest<UserProfile>("/auth/me", { token })
      .then(setUser)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"));
  }, [router]);

  return (
    <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {user && (
        <dl className="mt-6 space-y-3">
          <div>
            <dt className="text-sm text-slate-500">Name</dt>
            <dd className="font-semibold text-slate-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="font-semibold text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Role</dt>
            <dd className="font-semibold text-slate-900">{user.role}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
