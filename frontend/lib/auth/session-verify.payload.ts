import type { AppSession } from './session.types';

export function parseSessionPayload(json: string): AppSession | null {
  try {
    const parsed = JSON.parse(json) as AppSession;
    if (!parsed.access_token || typeof parsed.expires_at !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
