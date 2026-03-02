export type AppRole = 'ADMIN' | 'OPERATOR' | 'WHOLESALER';

export interface BackendMe {
  id: string;
  email: string;
  roles: AppRole[];
}

export function getBackendBaseUrl(): string {
  const configured = process.env.BACKEND_BASE_URL?.trim();
  if (!configured) {
    throw new Error('BACKEND_BASE_URL is not set');
  }
  return configured.replace(/\/$/, '');
}

export async function fetchMe(accessToken: string): Promise<BackendMe> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/users/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch /users/me (${res.status}): ${body}`);
  }

  return (await res.json()) as BackendMe;
}
