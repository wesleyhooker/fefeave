import { createHmac, timingSafeEqual } from 'crypto';
import { parseSessionPayload } from './session-verify.payload';
import type {
  SessionVerifyFailureReason,
  SessionVerifyResult,
} from './session-verify.types';
import type { AppSession } from './session.types';

function signPayload(payloadBase64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadBase64).digest('base64url');
}

export function verifySessionValue(
  raw: string | undefined,
  secretOverride?: string,
): SessionVerifyResult {
  if (!raw) {
    return { status: 'fail', reason: 'bad_payload' };
  }

  try {
    const dot = raw.lastIndexOf('.');
    if (dot <= 0) {
      return { status: 'fail', reason: 'bad_split' };
    }

    const payloadBase64 = raw.slice(0, dot);
    const providedSig = raw.slice(dot + 1);
    if (!providedSig) {
      return { status: 'fail', reason: 'empty_sig' };
    }

    const secret = secretOverride ?? process.env.AUTH_SESSION_SECRET?.trim();
    if (!secret) {
      return { status: 'fail', reason: 'no_secret' };
    }

    const expectedSig = signPayload(payloadBase64, secret);
    const providedBuf = Buffer.from(providedSig, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (
      providedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(providedBuf, expectedBuf)
    ) {
      return { status: 'fail', reason: 'sig_mismatch' };
    }

    const json = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const parsed = parseSessionPayload(json);
    if (!parsed) {
      return { status: 'fail', reason: 'bad_payload' };
    }

    return { status: 'ok', session: parsed, reason: 'ok' };
  } catch {
    return { status: 'fail', reason: 'exception' };
  }
}

export function encodeSessionValue(
  session: AppSession,
  secretOverride?: string,
): string {
  const secret = secretOverride ?? process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error('AUTH_SESSION_SECRET is not set');
  }
  const payloadBase64 = Buffer.from(JSON.stringify(session), 'utf8').toString(
    'base64url',
  );
  const signature = signPayload(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

export function resolveAuthDecision(
  raw: string | undefined,
  verifyResult: SessionVerifyResult,
  nowEpochSec = Math.floor(Date.now() / 1000),
): {
  decision: 'missing' | 'verify_failed' | 'expired' | 'ok';
  verifyReason?: SessionVerifyFailureReason;
} {
  if (!raw) {
    return { decision: 'missing' };
  }
  if (verifyResult.status === 'fail') {
    return { decision: 'verify_failed', verifyReason: verifyResult.reason };
  }
  if (verifyResult.session.expires_at <= nowEpochSec) {
    return { decision: 'expired' };
  }
  return { decision: 'ok' };
}
