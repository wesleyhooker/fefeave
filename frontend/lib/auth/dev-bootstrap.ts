import type { AppRole } from './session.types';
import type { BackendMe } from './backendUser';
import { getBackendBaseUrl } from './backendUser';

/**
 * Fixed bearer string for local dev_bypass only. The backend ignores JWT validation
 * in dev_bypass; identity comes from AUTH_DEV_BYPASS_* env on the API process.
 */
export const LOCAL_DEV_BOOTSTRAP_ACCESS_TOKEN = 'fefeave-local-dev-bootstrap';

const DEFAULT_NEXT = '/admin/dashboard';

/**
 * Restrict open redirects: only same-origin paths under /admin or /portal.
 */
export function safeNextPath(raw: string | null): string {
  if (!raw || typeof raw !== 'string') return DEFAULT_NEXT;
  const t = raw.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return DEFAULT_NEXT;
  if (!/^\/(admin|portal)(\/|$)/.test(t)) return DEFAULT_NEXT;
  return t;
}

function rolesAllowAdmin(roles: AppRole[]): boolean {
  return roles.some((r) => r === 'ADMIN' || r === 'OPERATOR');
}

function rolesAllowPortal(roles: AppRole[]): boolean {
  return roles.includes('WHOLESALER');
}

export function validateNextMatchesRoles(
  nextPath: string,
  roles: AppRole[],
): { ok: true } | { ok: false; message: string } {
  if (nextPath.startsWith('/admin') && !rolesAllowAdmin(roles)) {
    return {
      ok: false,
      message:
        'The `next` path is under /admin but the local backend user does not have ADMIN or OPERATOR. Fix AUTH_DEV_BYPASS_ROLE on the backend (e.g. ADMIN) or choose a different `next` path.',
    };
  }
  if (nextPath.startsWith('/portal') && !rolesAllowPortal(roles)) {
    return {
      ok: false,
      message:
        'The `next` path is under /portal but the local backend user is not a WHOLESALER. Align backend AUTH_DEV_BYPASS_ROLE or choose a different `next` path.',
    };
  }
  return { ok: true };
}

export type BootstrapBackendResult =
  | { ok: true; me: BackendMe }
  | { ok: false; status: number; message: string };

/**
 * Verifies the local API is reachable and behaves like dev_bypass for /users/me
 * using the local bootstrap bearer token (no valid Cognito JWT required).
 */
export async function fetchBackendMeForDevBootstrap(): Promise<BootstrapBackendResult> {
  let base: string;
  try {
    base = getBackendBaseUrl();
  } catch {
    return {
      ok: false,
      status: 503,
      message:
        'BACKEND_BASE_URL is not set. Add it to frontend/.env.local (see .env.example). For make dev, use http://localhost:3000/api.',
    };
  }

  const url = `${base}/users/me`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${LOCAL_DEV_BOOTSTRAP_ACCESS_TOKEN}`,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const me = (await res.json()) as BackendMe;
      if (
        me &&
        typeof me.id === 'string' &&
        typeof me.email === 'string' &&
        Array.isArray(me.roles)
      ) {
        return { ok: true, me };
      }
      return {
        ok: false,
        status: 503,
        message: `Unexpected JSON from ${url}. Check BACKEND_BASE_URL points at this app’s API (e.g. http://localhost:3000/api).`,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: 503,
        message:
          'Backend rejected /users/me. Local backend must use AUTH_MODE=dev_bypass (e.g. make dev-api or make dev). Cognito-only API mode is incompatible with dev bootstrap screenshots.',
      };
    }

    const body = await res.text();
    return {
      ok: false,
      status: 503,
      message: `Backend /users/me returned HTTP ${res.status}: ${body.slice(0, 400)}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      status: 503,
      message: `Could not reach backend at ${url}: ${msg}. Is the API running (make dev-api or make dev)?`,
    };
  }
}
