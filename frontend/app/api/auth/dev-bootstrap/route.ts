import { NextRequest, NextResponse } from 'next/server';
import {
  fetchBackendMeForDevBootstrap,
  LOCAL_DEV_BOOTSTRAP_ACCESS_TOKEN,
  safeNextPath,
  validateNextMatchesRoles,
} from '@/lib/auth/dev-bootstrap';
import { attachSessionCookieToResponse } from '@/lib/auth/session-cookie-response';
import type { AppRole } from '@/lib/auth/session.types';

/** Strip IPv6 brackets and lowercase for stable comparison (localhost is case-insensitive). */
function normalizeHostname(raw: string): string {
  let h = raw.trim();
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    if (end > 1) h = h.slice(1, end);
  }
  return h.toLowerCase();
}

/**
 * Loopback hosts only — dev-bootstrap must not run on arbitrary interfaces.
 * Canonical IPv6 loopback is `::1` (and full expanded form).
 */
function isAllowedLoopbackHost(normalized: string): boolean {
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '0:0:0:0:0:0:0:1'
  );
}

/**
 * Parse hostname from the direct HTTP `Host` header (not forwarded headers).
 * Handles `[::1]:port` and `127.0.0.1:port` without mis-parsing IPv6 colons.
 */
function hostnameFromHostHeader(hostHeader: string | null): string {
  if (hostHeader == null || hostHeader === '') return '';
  const trimmed = hostHeader.trim();
  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    if (end > 1) return normalizeHostname(trimmed.slice(0, end + 1));
    return '';
  }
  const colon = trimmed.lastIndexOf(':');
  if (colon > 0) {
    const after = trimmed.slice(colon + 1);
    if (/^\d+$/.test(after)) {
      const before = trimmed.slice(0, colon);
      /** `host:port` only — if `before` still contains `:`, it is IPv6 (RFC 5952 uses brackets; reject naive strip). */
      if (!before.includes(':')) {
        return normalizeHostname(before);
      }
    }
  }
  return normalizeHostname(trimmed);
}

/**
 * Prefer {@link NextURL#hostname} (request URL authority). If it is missing or not loopback,
 * fall back to the direct `Host` header only — never `X-Forwarded-Host` (spoofable by clients).
 */
function getValidatedLoopbackHostname(request: NextRequest): string | null {
  const fromUrl = normalizeHostname(request.nextUrl.hostname);
  if (fromUrl && isAllowedLoopbackHost(fromUrl)) {
    return fromUrl;
  }

  const fromDirectHost = hostnameFromHostHeader(request.headers.get('host'));
  if (fromDirectHost && isAllowedLoopbackHost(fromDirectHost)) {
    return fromDirectHost;
  }

  return null;
}

function featureDisabledResponse(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

/**
 * Local dev only: mint fefeave_session after verifying backend dev_bypass compatibility.
 * Gated by NODE_ENV, opt-in env, localhost, and shared secret. Fail-closed.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV !== 'development') {
    return featureDisabledResponse();
  }

  if (process.env.AUTH_DEV_BOOTSTRAP_ENABLED !== '1') {
    return featureDisabledResponse();
  }

  const expectedSecret = process.env.AUTH_DEV_BOOTSTRAP_SECRET?.trim();
  if (!expectedSecret) {
    return featureDisabledResponse();
  }

  const host = getValidatedLoopbackHostname(request);
  if (host == null) {
    return NextResponse.json(
      {
        error: 'forbidden',
        message: 'dev-bootstrap is only allowed for localhost / 127.0.0.1.',
      },
      { status: 403 },
    );
  }

  const providedSecret = request.nextUrl.searchParams.get('secret');
  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json(
      {
        error: 'forbidden',
        message: 'Invalid or missing secret query parameter.',
      },
      { status: 403 },
    );
  }

  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'));

  const backend = await fetchBackendMeForDevBootstrap();
  if (!backend.ok) {
    return NextResponse.json(
      { error: 'bootstrap_unavailable', message: backend.message },
      { status: backend.status },
    );
  }

  const { me } = backend;
  const roles = me.roles.filter((r): r is AppRole =>
    ['ADMIN', 'OPERATOR', 'WHOLESALER'].includes(r),
  );

  const roleCheck = validateNextMatchesRoles(nextPath, roles);
  if (!roleCheck.ok) {
    return NextResponse.json(
      { error: 'bootstrap_incompatible', message: roleCheck.message },
      { status: 503 },
    );
  }

  const expiresInSec = 8 * 3600;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec;

  const session = {
    access_token: LOCAL_DEV_BOOTSTRAP_ACCESS_TOKEN,
    expires_at: expiresAt,
    roles,
    user: {
      id: me.id,
      email: me.email,
    },
  };

  try {
    const redirectTarget = new URL(nextPath, request.nextUrl.origin);
    const response = NextResponse.redirect(redirectTarget);
    attachSessionCookieToResponse(response, session);
    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: 'session_error',
        message:
          msg.includes('AUTH_SESSION_SECRET') || msg.includes('not set')
            ? 'AUTH_SESSION_SECRET is not set in frontend/.env.local.'
            : 'Could not set session cookie.',
      },
      { status: 500 },
    );
  }
}
