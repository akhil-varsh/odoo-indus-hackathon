"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, setToken } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AuthMode = "login" | "signup";

type SignupRoleResponse = {
  roles: string[];
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    roles: "WAREHOUSE_STAFF",
  });
  const [roles, setRoles] = useState<string[]>(["INVENTORY_MANAGER", "WAREHOUSE_STAFF"]);

  useMemo(() => {
    apiRequest<SignupRoleResponse>("/auth/signup-roles")
      .then((data) => {
        setRoles(data.roles);
      })
      .catch(() => {
        setRoles(["INVENTORY_MANAGER", "WAREHOUSE_STAFF"]);
      });
  }, []);

  const validate = () => {
    if (mode === "login") {
      if (!loginForm.email || !loginForm.password) {
        return "Email and password are required.";
      }
      return "";
    }

    if (!signupForm.name || !signupForm.email || !signupForm.password || !signupForm.confirmPassword) {
      return "All signup fields are required.";
    }
    if (signupForm.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      return "Password and confirm password do not match.";
    }
    return "";
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    setError(validationError);
    if (validationError) {
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const response = await apiRequest<{ token: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify(loginForm),
        });
        setToken(response.token);
      } else {
        const response = await apiRequest<{ token: string }>("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: signupForm.name,
            email: signupForm.email,
            password: signupForm.password,
            role: signupForm.roles,
          }),
        });
        setToken(response.token);
      }

      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900">
      <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />

      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl lg:grid-cols-2">
          <div className="hidden bg-slate-900/60 p-10 text-white lg:block">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Core Inventory</p>
            <h1 className="mt-3 text-5xl font-black leading-tight">Real-Time Stock Control</h1>
            <p className="mt-4 text-slate-200">
              Replace manual sheets with a centralized workflow for receipts, deliveries, transfers, and adjustments.
            </p>
          </div>

          <Card className="m-4 border-0 bg-white md:m-6">
            <CardHeader className="pb-0">
              <Badge variant="secondary" className="w-fit">Authentication</Badge>
              <CardTitle>Login / Signup</CardTitle>
              <CardDescription>Use your credentials to access dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                className={`w-1/2 rounded-lg px-4 py-2 text-sm font-semibold ${
                  mode === "login" ? "bg-emerald-600 text-white" : "text-slate-700"
                }`}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={`w-1/2 rounded-lg px-4 py-2 text-sm font-semibold ${
                  mode === "signup" ? "bg-emerald-600 text-white" : "text-slate-700"
                }`}
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
              >
                Sign Up
              </button>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              {mode === "signup" && (
                <Input
                  className="h-11 rounded-xl"
                  placeholder="Name"
                  value={signupForm.name}
                  onChange={(event) => setSignupForm((old) => ({ ...old, name: event.target.value }))}
                />
              )}

              <Input
                className="h-11 rounded-xl"
                placeholder="Email"
                type="email"
                value={mode === "login" ? loginForm.email : signupForm.email}
                onChange={(event) =>
                  mode === "login"
                    ? setLoginForm((old) => ({ ...old, email: event.target.value }))
                    : setSignupForm((old) => ({ ...old, email: event.target.value }))
                }
              />

              <Input
                className="h-11 rounded-xl"
                placeholder="Password"
                type="password"
                value={mode === "login" ? loginForm.password : signupForm.password}
                onChange={(event) =>
                  mode === "login"
                    ? setLoginForm((old) => ({ ...old, password: event.target.value }))
                    : setSignupForm((old) => ({ ...old, password: event.target.value }))
                }
              />

              {mode === "signup" && (
                <>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 py-3"
                    value={signupForm.roles}
                    onChange={(event) => setSignupForm((old) => ({ ...old, roles: event.target.value }))}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="h-11 rounded-xl"
                    placeholder="Confirm Password"
                    type="password"
                    value={signupForm.confirmPassword}
                    onChange={(event) =>
                      setSignupForm((old) => ({ ...old, confirmPassword: event.target.value }))
                    }
                  />
                </>
              )}

              {mode === "login" && (
                <a href="#" className="text-sm font-semibold text-emerald-700">
                  Forgot password?
                </a>
              )}

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <Button
                className="h-11 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
                disabled={loading}
                type="submit"
              >
                {loading ? "Please wait..." : "Submit"}
              </Button>
            </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
