import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  appendSessionCookieClearHeaders,
  applySessionCookieClear,
  getSessionCookieClearOptionsList,
  getSessionCookieDomain,
  getSessionCookieSetOptions,
  serializeSessionCookieClear,
} from './session-cookie-options.ts';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('session cookie options', () => {
  it('sets secure lax httpOnly path in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SESSION_COOKIE_DOMAIN;

    const options = getSessionCookieSetOptions(
      new Date('2030-01-01T00:00:00Z'),
    );
    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, 'lax');
    assert.equal(options.path, '/');
    assert.equal(options.domain, '.fefeave.com');
  });

  it('omits domain outside production', () => {
    process.env.NODE_ENV = 'development';
    const options = getSessionCookieSetOptions(
      new Date('2030-01-01T00:00:00Z'),
    );
    assert.equal(options.secure, false);
    assert.equal(options.domain, undefined);
  });

  it('clear options match set attributes and include host + domain variants in prod', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SESSION_COOKIE_DOMAIN;

    const clearOptions = getSessionCookieClearOptionsList();
    assert.equal(clearOptions.length, 2);
    assert.equal(clearOptions[0]?.domain, undefined);
    assert.equal(clearOptions[1]?.domain, '.fefeave.com');

    for (const options of clearOptions) {
      assert.equal(options.name, 'fefeave_session');
      assert.equal(options.value, '');
      assert.equal(options.httpOnly, true);
      assert.equal(options.secure, true);
      assert.equal(options.sameSite, 'lax');
      assert.equal(options.path, '/');
      assert.equal(options.expires.getTime(), 0);
    }
  });

  it('applySessionCookieClear writes all clear variants', () => {
    process.env.NODE_ENV = 'production';
    const writes: Array<{ name: string; value: string; options: unknown }> = [];
    applySessionCookieClear({
      set(name, value, options) {
        writes.push({ name, value, options });
      },
    });

    assert.equal(writes.length, getSessionCookieClearOptionsList().length);
    assert.ok(writes.every((write) => write.name === 'fefeave_session'));
    assert.ok(writes.every((write) => write.value === ''));
  });

  it('respects SESSION_COOKIE_DOMAIN override', () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_COOKIE_DOMAIN = '.example.com';
    assert.equal(getSessionCookieDomain(), '.example.com');
  });

  it('serializes secure clear cookies with optional domain', () => {
    process.env.NODE_ENV = 'production';
    const [hostOnly, withDomain] = getSessionCookieClearOptionsList();
    assert.match(serializeSessionCookieClear(hostOnly), /Secure/);
    assert.match(serializeSessionCookieClear(hostOnly), /HttpOnly/);
    assert.doesNotMatch(serializeSessionCookieClear(hostOnly), /Domain=/);
    assert.match(
      serializeSessionCookieClear(withDomain),
      /Domain=\.fefeave\.com/,
    );
  });

  it('appendSessionCookieClearHeaders emits both clear variants', () => {
    process.env.NODE_ENV = 'production';
    const headers = new Headers();
    appendSessionCookieClearHeaders(headers);
    const cookies = headers.getSetCookie();
    assert.equal(cookies.length, 2);
    assert.ok(cookies.some((value) => !value.includes('Domain=')));
    assert.ok(cookies.some((value) => value.includes('Domain=.fefeave.com')));
  });
});
