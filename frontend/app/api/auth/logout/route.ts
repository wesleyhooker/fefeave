import { NextRequest, NextResponse } from 'next/server';
import { appendSessionCookieClearHeaders } from '@/lib/auth/session-cookie-options';
import { buildCognitoLogoutUrl } from '@/src/lib/auth/cognito';

async function handleLogout(request: NextRequest): Promise<NextResponse> {
  const domain = process.env.COGNITO_DOMAIN?.trim();
  const clientId = process.env.COGNITO_CLIENT_ID?.trim();

  if (!domain || !clientId) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    appendSessionCookieClearHeaders(response.headers);
    return response;
  }

  const logoutUri =
    process.env.COGNITO_LOGOUT_URI?.trim() || `${request.nextUrl.origin}/login`;
  const redirectTo = buildCognitoLogoutUrl({
    domain,
    clientId,
    logoutUri,
  });
  const response = NextResponse.redirect(redirectTo);
  appendSessionCookieClearHeaders(response.headers);
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleLogout(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleLogout(request);
}
