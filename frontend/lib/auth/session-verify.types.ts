import type { AppSession } from './session.types';

/** Internal verification detail — never expose to the browser. */
export type SessionVerifyReason =
  | 'missing'
  | 'bad_split'
  | 'empty_sig'
  | 'no_secret'
  | 'sig_mismatch'
  | 'bad_payload'
  | 'exception'
  | 'expired'
  | 'ok';

export type SessionVerifyFailureReason = Exclude<
  SessionVerifyReason,
  'ok' | 'expired' | 'missing'
>;

export type SessionVerifyResult =
  | { status: 'ok'; session: AppSession; reason: 'ok' }
  | {
      status: 'fail';
      reason: SessionVerifyFailureReason;
    };

/** High-level auth outcome for health diagnostics (browser-safe). */
export type AuthDecision = 'missing' | 'verify_failed' | 'expired' | 'ok';
