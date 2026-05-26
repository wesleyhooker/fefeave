import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  formatAuthHealthLogLine,
  inspectSessionAuth,
} from '@/lib/auth/session-diagnostics';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session-constants';

export async function GET(): Promise<NextResponse> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const cookieHeader = headerStore.get('cookie');
  const parsed = cookieStore.get(SESSION_COOKIE_NAME);

  const inspection = inspectSessionAuth({
    cookieHeader,
    parsedCookieValue: parsed?.value,
    cookiesHasSession: cookieStore.has(SESSION_COOKIE_NAME),
  });

  // Safe prod diagnostics — never log cookie values or tokens.
  console.info('[auth/health]', formatAuthHealthLogLine(inspection));

  if (!inspection.session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: inspection.session.user
      ? {
          id: inspection.session.user.id,
          email: inspection.session.user.email,
        }
      : undefined,
    roles: inspection.session.roles ?? [],
    expiresAt: inspection.session.expires_at,
  });
}
