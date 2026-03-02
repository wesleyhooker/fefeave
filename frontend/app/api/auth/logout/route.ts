import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session.node';
import { buildCognitoLogoutUrl } from '@/src/lib/auth/cognito';

async function handleLogout(request: NextRequest): Promise<NextResponse> {
  await clearSessionCookie();

  const domain = process.env.COGNITO_DOMAIN?.trim();
  const clientId = process.env.COGNITO_CLIENT_ID?.trim();

  if (!domain || !clientId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const logoutUri =
    process.env.COGNITO_LOGOUT_URI?.trim() || `${request.nextUrl.origin}/login`;
  const redirectTo = buildCognitoLogoutUrl({
    domain,
    clientId,
    logoutUri,
  });
  return NextResponse.redirect(redirectTo);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleLogout(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleLogout(request);
}
