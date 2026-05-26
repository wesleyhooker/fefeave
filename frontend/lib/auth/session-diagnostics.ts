import { SESSION_COOKIE_NAME } from './session-constants';
import { resolveAuthDecision, verifySessionValue } from './session-verify.node';
import type { AuthDecision, SessionVerifyReason } from './session-verify.types';
import type { AppSession } from './session.types';

export function countNamedCookieOccurrences(
  cookieHeader: string,
  name: string = SESSION_COOKIE_NAME,
): number {
  if (!cookieHeader) return 0;
  const prefix = `${name}=`;
  let count = 0;
  for (const part of cookieHeader.split(';')) {
    if (part.trim().startsWith(prefix)) count += 1;
  }
  return count;
}

export function cookieHeaderContainsName(
  cookieHeader: string,
  name: string = SESSION_COOKIE_NAME,
): boolean {
  return cookieHeader.includes(`${name}=`);
}

export type SessionAuthInspection = {
  cookieHeaderPresent: boolean;
  rawContainsSession: boolean;
  sessionOccurrences: number;
  cookiesHasSession: boolean;
  rawCookieLength: number | null;
  decision: AuthDecision;
  verifyReason?: SessionVerifyReason;
  session: AppSession | null;
};

export function inspectSessionAuth(input: {
  cookieHeader: string | null;
  parsedCookieValue: string | undefined;
  cookiesHasSession: boolean;
  nowEpochSec?: number;
}): SessionAuthInspection {
  const cookieHeader = input.cookieHeader ?? '';
  const raw = input.parsedCookieValue;
  const verifyResult = verifySessionValue(raw);
  const { decision, verifyReason } = resolveAuthDecision(
    raw,
    verifyResult,
    input.nowEpochSec,
  );

  let session: AppSession | null = null;
  if (verifyResult.status === 'ok' && decision === 'ok') {
    session = verifyResult.session;
  }

  return {
    cookieHeaderPresent: cookieHeader.length > 0,
    rawContainsSession: cookieHeaderContainsName(cookieHeader),
    sessionOccurrences: countNamedCookieOccurrences(cookieHeader),
    cookiesHasSession: input.cookiesHasSession,
    rawCookieLength: raw ? raw.length : null,
    decision,
    verifyReason:
      decision === 'verify_failed'
        ? verifyReason
        : decision === 'expired'
          ? 'expired'
          : decision === 'ok'
            ? 'ok'
            : 'missing',
    session,
  };
}

export function formatAuthHealthLogLine(
  inspection: SessionAuthInspection,
): Record<string, boolean | number | string | null> {
  return {
    cookieHeaderPresent: inspection.cookieHeaderPresent,
    rawContainsSession: inspection.rawContainsSession,
    sessionOccurrences: inspection.sessionOccurrences,
    cookiesHasSession: inspection.cookiesHasSession,
    rawCookieLength: inspection.rawCookieLength,
    decision: inspection.decision,
    ...(inspection.decision === 'verify_failed' && inspection.verifyReason
      ? { verifyReason: inspection.verifyReason }
      : {}),
  };
}
