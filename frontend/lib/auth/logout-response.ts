import { NextRequest, NextResponse } from 'next/server';
import { appendSessionCookieClearHeaders } from './session-cookie-options';
import { buildCognitoLogoutUrl } from '@/src/lib/auth/cognito';

export function createLogoutResponse(
  request: NextRequest,
  options: { clearSession: boolean },
): NextResponse {
  const domain = process.env.COGNITO_DOMAIN?.trim();
  const clientId = process.env.COGNITO_CLIENT_ID?.trim();

  let response: NextResponse;
  if (!domain || !clientId) {
    response = NextResponse.redirect(new URL('/login', request.url));
  } else {
    const logoutUri =
      process.env.COGNITO_LOGOUT_URI?.trim() ||
      `${request.nextUrl.origin}/login`;
    const redirectTo = buildCognitoLogoutUrl({
      domain,
      clientId,
      logoutUri,
    });
    response = NextResponse.redirect(redirectTo);
  }

  if (options.clearSession) {
    appendSessionCookieClearHeaders(response.headers);
  }

  return response;
}
