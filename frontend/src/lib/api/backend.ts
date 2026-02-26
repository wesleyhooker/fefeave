const DEFAULT_BACKEND_URL = 'http://localhost:3001/api';

function getBackendBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      'NEXT_PUBLIC_BACKEND_URL is not set. Add it to frontend/.env.local (e.g. http://localhost:3001/api).',
    );
  }

  return DEFAULT_BACKEND_URL;
}

function toAbsoluteUrl(path: string): string {
  const base = getBackendBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export async function backendGetJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(toAbsoluteUrl(path), {
    method: 'GET',
    cache: 'no-store',
    ...init,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Backend GET ${path} failed (${res.status} ${res.statusText}): ${body}`,
    );
  }

  return res.json() as Promise<T>;
}
