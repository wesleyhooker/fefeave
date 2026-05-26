import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from './session-constants';
import { attachSessionCookieToResponse } from './session-cookie-response';
import { getSessionCookieSetOptions } from './session-cookie-options';
import { encodeSessionValue, verifySessionValue } from './session-verify.node';
import type { AppSession } from './session.types';

export { appendSessionCookieClearHeaders } from './session-cookie-options';
export {
  attachSessionCookieToResponse,
  type SessionCookieAttachMeta,
} from './session-cookie-response';

/** Prefer attachSessionCookieToResponse when returning NextResponse.redirect(). */
export async function setSessionCookie(session: AppSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encodeSessionValue(session), {
    ...getSessionCookieSetOptions(new Date(session.expires_at * 1000)),
  });
}

export function setSessionCookieOnResponse(
  response: NextResponse,
  session: AppSession,
) {
  return attachSessionCookieToResponse(response, session);
}

export async function getSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;

  const verifyResult = verifySessionValue(raw);
  if (verifyResult.status === 'fail') return null;

  const nowEpochSec = Math.floor(Date.now() / 1000);
  if (verifyResult.session.expires_at <= nowEpochSec) return null;
  return verifyResult.session;
}

export { verifySessionValue } from './session-verify.node';
