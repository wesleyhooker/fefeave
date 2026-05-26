import { SESSION_COOKIE_NAME } from './session-constants';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export type SessionCookieWriter = {
  set: (
    name: string,
    value: string,
    options?: SessionCookieWriteOptions,
  ) => void;
};

/**
 * Shared session cookie domain for apex + www in production.
 * Override with SESSION_COOKIE_DOMAIN (e.g. ".fefeave.com") if needed.
 */
export function getSessionCookieDomain(): string | undefined {
  if (!isProduction()) return undefined;
  const override = process.env.SESSION_COOKIE_DOMAIN?.trim();
  return override || '.fefeave.com';
}

export type SessionCookieWriteOptions = {
  name?: string;
  value?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax';
  path?: string;
  expires?: Date;
  domain?: string;
};

export function getSessionCookieSetOptions(
  expires: Date,
): Omit<SessionCookieWriteOptions, 'name' | 'value'> {
  const domain = getSessionCookieDomain();
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    expires,
    ...(domain ? { domain } : {}),
  };
}

export type SessionCookieClearOptions = Required<
  Pick<
    SessionCookieWriteOptions,
    'httpOnly' | 'secure' | 'sameSite' | 'path' | 'expires'
  >
> & {
  name: string;
  value: string;
  domain?: string;
};

/**
 * Clear variants cover both host-only (legacy) and domain cookies so stale
 * duplicates are evicted after attribute/domain changes.
 */
export function getSessionCookieClearOptionsList(): SessionCookieClearOptions[] {
  const expired = new Date(0);
  const base = getSessionCookieSetOptions(expired);
  const variants: SessionCookieClearOptions[] = [
    {
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: base.httpOnly!,
      secure: base.secure!,
      sameSite: base.sameSite!,
      path: base.path!,
      expires: expired,
    },
  ];

  if (base.domain) {
    variants.push({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: base.httpOnly!,
      secure: base.secure!,
      sameSite: base.sameSite!,
      path: base.path!,
      expires: expired,
      domain: base.domain,
    });
  }

  return variants;
}

export function serializeSessionCookieClear(
  options: SessionCookieClearOptions,
): string {
  const parts = [
    `${options.name}=${options.value}`,
    `Path=${options.path}`,
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    'SameSite=Lax',
  ];
  if (options.domain) {
    parts.splice(2, 0, `Domain=${options.domain}`);
  }
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

/** Append distinct Set-Cookie headers (host-only + domain) without last-wins overwrite. */
export function appendSessionCookieClearHeaders(headers: Headers): void {
  for (const options of getSessionCookieClearOptionsList()) {
    headers.append('Set-Cookie', serializeSessionCookieClear(options));
  }
}

export function applySessionCookieClear(
  cookieStore: SessionCookieWriter,
): void {
  for (const options of getSessionCookieClearOptionsList()) {
    cookieStore.set(options.name, options.value, options);
  }
}

/** Estimate Set-Cookie header length without logging the cookie value. */
export function estimateSessionSetCookieHeaderLength(
  cookieName: string,
  cookieValueLength: number,
  expires: Date,
): number {
  const options = getSessionCookieSetOptions(expires);
  const domainPart = options.domain ? `; Domain=${options.domain}` : '';
  const expiresPart = `; Expires=${expires.toUTCString()}`;
  const securePart = options.secure ? '; Secure' : '';
  const attrs = `${domainPart}${expiresPart}; HttpOnly; SameSite=Lax${securePart}; Path=${options.path}`;
  return (
    Buffer.byteLength(cookieName, 'utf8') +
    1 +
    cookieValueLength +
    Buffer.byteLength(attrs, 'utf8')
  );
}
