/**
 * Minimal API client for backend calls.
 * Base URL: NEXT_PUBLIC_BACKEND_URL (default /api via BFF proxy).
 * Auth: When Cognito or another token source is added, set Authorization in getAuthHeaders().
 */

const DEFAULT_BACKEND_URL = '/api';

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL;
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL;
}

/** Headers for authenticated requests. When auth is added (e.g. Cognito), set Authorization: Bearer <token> here. */
function getAuthHeaders(): HeadersInit {
  return {};
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const base = getBaseUrl().replace(/\/$/, '');
  const pathPart = path.startsWith('/') ? path : `/${path}`;
  if (params && Object.keys(params).length > 0) {
    return `${base}${pathPart}?${new URLSearchParams(params).toString()}`;
  }
  return `${base}${pathPart}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** GET request that returns response body as text (e.g. for CSV export). */
export async function apiGetText(
  path: string,
  params?: Record<string, string>,
): Promise<string> {
  const res = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: { ...getAuthHeaders() },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.text();
}
