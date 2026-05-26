import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  countNamedCookieOccurrences,
  inspectSessionAuth,
} from './session-diagnostics.ts';
import { encodeSessionValue } from './session-verify.node.ts';
import type { AppSession } from './session.types.ts';

const secret = 'diag-secret';
const session: AppSession = {
  access_token: 'access-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

describe('session diagnostics', () => {
  it('counts duplicate cookie occurrences in raw header', () => {
    const header =
      'cf_clearance=abc; fefeave_session=one; fefeave_session=two; other=1';
    assert.equal(countNamedCookieOccurrences(header), 2);
  });

  it('reports missing when parser has no session cookie', () => {
    const inspection = inspectSessionAuth({
      cookieHeader: 'cf_clearance=abc',
      parsedCookieValue: undefined,
      cookiesHasSession: false,
    });
    assert.equal(inspection.decision, 'missing');
    assert.equal(inspection.rawContainsSession, false);
    assert.equal(inspection.sessionOccurrences, 0);
  });

  it('reports verify_failed when last parsed value is empty', () => {
    const inspection = inspectSessionAuth({
      cookieHeader: 'fefeave_session=valid-looking; fefeave_session=',
      parsedCookieValue: '',
      cookiesHasSession: true,
      nowEpochSec: Math.floor(Date.now() / 1000),
    });
    assert.equal(inspection.decision, 'missing');
    assert.equal(inspection.sessionOccurrences, 2);
    assert.equal(inspection.cookiesHasSession, true);
  });

  it('reports ok for a valid parsed session', () => {
    const encoded = encodeSessionValue(session, secret);
    const previousSecret = process.env.AUTH_SESSION_SECRET;
    process.env.AUTH_SESSION_SECRET = secret;

    try {
      const inspection = inspectSessionAuth({
        cookieHeader: `fefeave_session=${encoded}`,
        parsedCookieValue: encoded,
        cookiesHasSession: true,
      });
      assert.equal(inspection.decision, 'ok');
      assert.equal(inspection.verifyReason, 'ok');
      assert.ok(inspection.rawCookieLength && inspection.rawCookieLength > 0);
      assert.ok(inspection.session);
    } finally {
      if (previousSecret === undefined) {
        delete process.env.AUTH_SESSION_SECRET;
      } else {
        process.env.AUTH_SESSION_SECRET = previousSecret;
      }
    }
  });
});
