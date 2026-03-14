import { getToken } from "@/lib/api";

export type UserRole = "ADMIN" | "INVENTORY_MANAGER" | "WAREHOUSE_STAFF";

type JwtPayload = {
  role?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payloadJson = atob(padded);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserRoleFromToken(): UserRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = getToken();
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  const role = payload?.role;
  if (role === "ADMIN" || role === "INVENTORY_MANAGER" || role === "WAREHOUSE_STAFF") {
    return role;
  }

  return null;
}

export function isInventoryManagerRole(role: UserRole | null): boolean {
  return role === "ADMIN" || role === "INVENTORY_MANAGER";
}
