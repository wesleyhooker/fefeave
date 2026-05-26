import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  encodeSessionValue,
  resolveAuthDecision,
  verifySessionValue,
} from './session-verify.node.ts';
import type { AppSession } from './session.types.ts';

const secret = 'test-secret';
const session: AppSession = {
  access_token: 'access-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  roles: ['ADMIN'],
  user: { id: 'user-1', email: 'admin@example.com' },
};

describe('session verification', () => {
  it('verifies a valid encoded session', () => {
    const encoded = encodeSessionValue(session, secret);
    const result = verifySessionValue(encoded, secret);
    assert.equal(result.status, 'ok');
    if (result.status === 'ok') {
      assert.equal(result.session.access_token, session.access_token);
    }
  });

  it('returns sig_mismatch for tampered signature', () => {
    const encoded = encodeSessionValue(session, secret);
    const tampered = `${encoded.slice(0, -1)}x`;
    const result = verifySessionValue(tampered, secret);
    assert.equal(result.status, 'fail');
    if (result.status === 'fail') {
      assert.equal(result.reason, 'sig_mismatch');
    }
  });

  it('returns bad_split when value has no dot', () => {
    const result = verifySessionValue('not-a-session', secret);
    assert.equal(result.status, 'fail');
    if (result.status === 'fail') {
      assert.equal(result.reason, 'bad_split');
    }
  });

  it('returns empty_sig when signature segment is missing', () => {
    const encoded = encodeSessionValue(session, secret);
    const result = verifySessionValue(`${encoded}.`, secret);
    assert.equal(result.status, 'fail');
    if (result.status === 'fail') {
      assert.equal(result.reason, 'empty_sig');
    }
  });

  it('maps verify failures and expiry to auth decisions', () => {
    const encoded = encodeSessionValue(session, secret);
    const ok = verifySessionValue(encoded, secret);
    assert.deepEqual(
      resolveAuthDecision(encoded, ok, session.expires_at - 10),
      { decision: 'ok' },
    );

    const expiredSession = {
      ...session,
      expires_at: Math.floor(Date.now() / 1000) - 10,
    };
    const expiredEncoded = encodeSessionValue(expiredSession, secret);
    const expiredVerify = verifySessionValue(expiredEncoded, secret);
    assert.deepEqual(
      resolveAuthDecision(
        expiredEncoded,
        expiredVerify,
        Math.floor(Date.now() / 1000),
      ),
      { decision: 'expired' },
    );

    assert.deepEqual(
      resolveAuthDecision(undefined, verifySessionValue('', secret)),
      {
        decision: 'missing',
      },
    );
  });
});
