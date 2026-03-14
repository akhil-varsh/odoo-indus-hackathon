export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://2c1e-2409-40f0-fc-fd1e-c512-fbd4-a0d9-ce11.ngrok-free.app/api";

type RequestOptions = RequestInit & {
  token?: string | null;
};

type ErrorLike = {
  error?: string;
  message?: string;
};

function isErrorLike(value: unknown): value is ErrorLike {
  return typeof value === "object" && value !== null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  headers.set("ngrok-skip-browser-warning", "true");

  // Only set JSON content-type when a request body exists.
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  let data: unknown = null;
  if (text) {
    if (contentType.includes("application/json")) {
      data = JSON.parse(text);
    } else {
      // HTML/plain text usually means tunnel, proxy, or server error page.
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const raw =
      typeof data === "object" && data !== null && "raw" in data && typeof (data as { raw?: unknown }).raw === "string"
        ? (data as { raw: string }).raw
        : null;
    const isHtml = typeof raw === "string" && raw.trimStart().startsWith("<!DOCTYPE");
    const errorLike = isErrorLike(data) ? data : {};
    const message =
      errorLike.error ||
      errorLike.message ||
      (isHtml
        ? "Received HTML instead of JSON. Check backend/ngrok availability and CORS settings."
        : `Request failed: ${response.status}`);
    throw new Error(message);
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "raw" in data &&
    typeof (data as { raw?: unknown }).raw === "string"
  ) {
    throw new Error("Expected JSON response but received non-JSON content.");
  }

  return data as T;
}

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("ims_token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("ims_token", token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("ims_token");
  }
}
