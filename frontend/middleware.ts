import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-constants';
import { verifySessionCookie } from '@/lib/auth/session.edge';
import type { AppRole } from '@/lib/auth/session.types';

function extractRolesFromSession(session: { roles?: AppRole[] }): AppRole[] {
  const roles = Array.isArray(session.roles) ? session.roles : [];
  return roles.filter(
    (role): role is AppRole =>
      role === 'ADMIN' || role === 'OPERATOR' || role === 'WHOLESALER',
  );
}

function redirectToLogin(request: NextRequest): NextResponse {
  const target = new URL('/login', request.url);
  target.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(target);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  const session = await verifySessionCookie(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  if (!session) {
    return redirectToLogin(request);
  }

  const nowEpochSec = Math.floor(Date.now() / 1000);
  if (session.expires_at <= nowEpochSec) {
    const response = redirectToLogin(request);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const roles = extractRolesFromSession(session);
  const needsAdmin = path.startsWith('/admin');
  const needsPortal = path.startsWith('/portal');
  if (needsAdmin && !(roles.includes('ADMIN') || roles.includes('OPERATOR'))) {
    return NextResponse.redirect(new URL('/403', request.url));
  }
  if (needsPortal && !roles.includes('WHOLESALER')) {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
};
