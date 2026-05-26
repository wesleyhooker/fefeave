import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { NextResponse } from 'next/server';
import { attachSessionCookieToResponse } from './session-cookie-response.ts';
import type { AppSession } from './session.types.ts';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('attachSessionCookieToResponse', () => {
  it('sets Set-Cookie on the redirect response object', () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_SESSION_SECRET = 'test-secret';

    const session: AppSession = {
      access_token: 'access-token-value',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      roles: ['ADMIN'],
      user: { id: 'u1', email: 'a@example.com' },
    };

    const response = NextResponse.redirect(
      'https://fefeave.com/admin/dashboard',
    );
    const meta = attachSessionCookieToResponse(response, session);

    assert.equal(meta.setCookieCount, 1);
    assert.equal(meta.domain, '.fefeave.com');
    assert.equal(meta.secure, true);
    assert.equal(meta.httpOnly, true);
    assert.equal(meta.sameSite, 'lax');
    assert.equal(meta.path, '/');
    assert.ok(meta.cookieValueLength > 0);
    assert.ok(meta.estimatedSetCookieHeaderBytes < 4096);

    const setCookies = response.headers.getSetCookie();
    assert.equal(setCookies.length, 1);
    assert.match(setCookies[0]!, /^fefeave_session=/);
    assert.match(setCookies[0]!, /Domain=\.fefeave\.com/);
    assert.match(setCookies[0]!, /Secure/);
    assert.match(setCookies[0]!, /HttpOnly/);
    assert.match(setCookies[0]!, /SameSite=Lax/i);
  });
});
