/**
 * Tiny fetch wrapper for the Easy IELTS REST API.
 *
 * - Always sends credentials so the server-issued auth cookie is included.
 * - Also forwards a Bearer token from localStorage when present (so the API
 *   works for callers that prefer headers, e.g. mobile clients).
 * - Returns the JSON envelope's `data` field on success and throws an
 *   ApiError with the server message on failure.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type FetchOpts = Omit<RequestInit, "body"> & { body?: unknown };

function tokenHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t = window.localStorage.getItem("eielts_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function apiFetch<T = unknown>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { body, headers, method, ...rest } = opts;
  const res = await fetch(`${API_URL}${path}`, {
    method: method || (body ? "POST" : "GET"),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...tokenHeader(),
      ...(headers as Record<string, string> | undefined),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  let payload: any = null;
  const text = await res.text();
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text };
  }

  if (!res.ok) {
    const msg = (payload && (payload.message || payload.error)) || `Request failed: ${res.status}`;
    throw new ApiError(res.status, msg, payload?.errors);
  }

  // Servers may return either { success, data } or a raw payload — handle both.
  if (payload && typeof payload === "object" && "data" in payload) return payload.data as T;
  return payload as T;
}

export const api = {
  get:    <T = unknown>(p: string) => apiFetch<T>(p, { method: "GET" }),
  post:   <T = unknown>(p: string, body?: unknown) => apiFetch<T>(p, { method: "POST", body }),
  put:    <T = unknown>(p: string, body?: unknown) => apiFetch<T>(p, { method: "PUT", body }),
  patch:  <T = unknown>(p: string, body?: unknown) => apiFetch<T>(p, { method: "PATCH", body }),
  delete: <T = unknown>(p: string) => apiFetch<T>(p, { method: "DELETE" }),
};
