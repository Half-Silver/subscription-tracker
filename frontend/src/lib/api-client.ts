const BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:3001";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export const apiBaseUrl = BASE;
