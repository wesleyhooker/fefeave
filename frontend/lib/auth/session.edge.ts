import type { AppSession } from './session.types';

function fromBase64(input: string): string {
  const binary = atob(input);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeBase64UrlToUtf8(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  );
  return fromBase64(padded);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function signPayload(
  payloadBase64: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadBase64),
  );
  return bytesToBase64Url(new Uint8Array(signatureBytes));
}

function safeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function verifySessionCookie(
  raw?: string,
): Promise<AppSession | null> {
  if (!raw) return null;
  try {
    const dot = raw.lastIndexOf('.');
    if (dot <= 0) return null;
    const payloadBase64 = raw.slice(0, dot);
    const providedSig = raw.slice(dot + 1);
    if (!providedSig) return null;

    const secret = process.env.AUTH_SESSION_SECRET?.trim();
    if (!secret) return null;
    const expectedSig = await signPayload(payloadBase64, secret);
    if (!safeEqualString(providedSig, expectedSig)) return null;

    const json = decodeBase64UrlToUtf8(payloadBase64);
    const parsed = JSON.parse(json) as AppSession;
    if (!parsed.access_token || typeof parsed.expires_at !== 'number')
      return null;
    return parsed;
  } catch {
    return null;
  }
}
