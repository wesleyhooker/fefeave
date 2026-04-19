import { NextRequest, NextResponse } from 'next/server';
import {
  fetchBackendMeForDevBootstrap,
  LOCAL_DEV_BOOTSTRAP_ACCESS_TOKEN,
  safeNextPath,
  validateNextMatchesRoles,
} from '@/lib/auth/dev-bootstrap';
import { setSessionCookie } from '@/lib/auth/session.node';
import type { AppRole } from '@/lib/auth/session.types';

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
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

  const host = request.nextUrl.hostname;
  if (!isLocalHost(host)) {
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

  try {
    await setSessionCookie({
      access_token: LOCAL_DEV_BOOTSTRAP_ACCESS_TOKEN,
      expires_at: expiresAt,
      roles,
      user: {
        id: me.id,
        email: me.email,
      },
    });
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

  return NextResponse.redirect(new URL(nextPath, request.nextUrl.origin));
}
