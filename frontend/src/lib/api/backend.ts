const DEFAULT_BACKEND_URL = '/api';

function getBackendBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  return DEFAULT_BACKEND_URL;
}

function toAbsoluteUrl(path: string): string {
  const base = getBackendBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseIsApi = /\/api$/.test(base);
  const deDuplicatedPath = baseIsApi
    ? normalizedPath.replace(/^\/api(?=\/|$)/, '')
    : normalizedPath;
  return `${base}${deDuplicatedPath}`;
}

export async function backendGetJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(toAbsoluteUrl(path), {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
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
