import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { NextRequest } from 'next/server';
import { createLogoutResponse } from './logout-response.ts';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('createLogoutResponse', () => {
  it('GET-style clearSession:false does not emit Set-Cookie clears', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.COGNITO_DOMAIN;
    delete process.env.COGNITO_CLIENT_ID;

    const request = new NextRequest('https://fefeave.com/api/auth/logout', {
      method: 'GET',
    });
    const response = createLogoutResponse(request, { clearSession: false });

    assert.equal(response.status, 307);
    assert.equal(response.headers.getSetCookie().length, 0);
  });

  it('POST-style clearSession:true emits session cookie clears', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.COGNITO_DOMAIN;
    delete process.env.COGNITO_CLIENT_ID;

    const request = new NextRequest('https://fefeave.com/api/auth/logout', {
      method: 'POST',
    });
    const response = createLogoutResponse(request, { clearSession: true });

    assert.equal(response.status, 307);
    const cookies = response.headers.getSetCookie();
    assert.equal(cookies.length, 2);
    assert.ok(cookies.every((value) => value.startsWith('fefeave_session=;')));
    assert.ok(cookies.some((value) => value.includes('Domain=.fefeave.com')));
  });
});
