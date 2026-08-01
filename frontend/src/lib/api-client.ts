const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export const apiBaseUrl = BASE;