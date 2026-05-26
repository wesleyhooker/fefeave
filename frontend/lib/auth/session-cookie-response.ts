import type { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from './session-constants';
import {
  estimateSessionSetCookieHeaderLength,
  getSessionCookieSetOptions,
} from './session-cookie-options';

export type SessionCookieAttachMeta = {
  sessionPayloadBytes: number;
  cookieValueLength: number;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'lax';
  expiresAt: number;
  estimatedSetCookieHeaderBytes: number;
  setCookieCount: number;
};
import { encodeSessionValue } from './session-verify.node';
import type { AppSession } from './session.types';

/**
 * Attach session cookie to the response that will be returned to the browser.
 * Required for redirects: cookies().set() is not reliably merged onto
 * NextResponse.redirect() in OpenNext/Lambda.
 */
export function attachSessionCookieToResponse(
  response: NextResponse,
  session: AppSession,
): SessionCookieAttachMeta {
  const value = encodeSessionValue(session);
  const expires = new Date(session.expires_at * 1000);
  const options = getSessionCookieSetOptions(expires);

  response.cookies.set(SESSION_COOKIE_NAME, value, options);

  const setCookieCount =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie().length
      : 1;

  return {
    sessionPayloadBytes: Buffer.byteLength(JSON.stringify(session), 'utf8'),
    cookieValueLength: value.length,
    domain: options.domain ?? 'host-only',
    path: options.path ?? '/',
    secure: options.secure ?? false,
    httpOnly: options.httpOnly ?? true,
    sameSite: 'lax',
    expiresAt: session.expires_at,
    estimatedSetCookieHeaderBytes: estimateSessionSetCookieHeaderLength(
      SESSION_COOKIE_NAME,
      value.length,
      expires,
    ),
    setCookieCount,
  };
}
