/**
 * Minimal API client for backend calls.
 * Base URL: NEXT_PUBLIC_BACKEND_URL (default http://localhost:3001/api).
 * Auth: When Cognito or another token source is added, set Authorization in getAuthHeaders().
 */

const DEFAULT_BACKEND_URL = 'http://localhost:3001/api';

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

export async function apiGet<T>(path: string): Promise<T> {
  const base = getBaseUrl().replace(/\/$/, '');
  const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  const res = await fetch(url, {
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
