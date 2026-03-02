import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { SESSION_COOKIE_NAME } from './session-constants';
import type { AppSession } from './session.types';

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error('AUTH_SESSION_SECRET is not set');
  }
  return secret;
}

function signPayload(payloadBase64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadBase64).digest('base64url');
}

function encodeSession(value: AppSession): string {
  const payloadBase64 = Buffer.from(JSON.stringify(value), 'utf8').toString(
    'base64url',
  );
  const signature = signPayload(payloadBase64, getSessionSecret());
  return `${payloadBase64}.${signature}`;
}

function decodeAndVerifySession(value: string): AppSession | null {
  try {
    const dot = value.lastIndexOf('.');
    if (dot <= 0) return null;
    const payloadBase64 = value.slice(0, dot);
    const providedSig = value.slice(dot + 1);
    if (!providedSig) return null;

    const secret = process.env.AUTH_SESSION_SECRET?.trim();
    if (!secret) return null;

    const expectedSig = signPayload(payloadBase64, secret);
    const providedBuf = Buffer.from(providedSig, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (
      providedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(providedBuf, expectedBuf)
    ) {
      return null;
    }

    const json = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as AppSession;
    if (!parsed.access_token || typeof parsed.expires_at !== 'number')
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: AppSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(session.expires_at * 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  const session = decodeAndVerifySession(raw);
  if (!session) return null;
  const nowEpochSec = Math.floor(Date.now() / 1000);
  if (session.expires_at <= nowEpochSec) return null;
  return session;
}
