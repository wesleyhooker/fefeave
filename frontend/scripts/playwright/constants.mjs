/**
 * Shared paths and defaults for local Playwright screenshot tooling (dev-only).
 * CWD is expected to be the frontend package root when scripts run via npm.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * Load frontend/.env.local into process.env when keys are unset (no extra deps).
 */
export function loadOptionalEnvLocal() {
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    } else {
      const hash = val.search(/\s+#/);
      if (hash !== -1) val = val.slice(0, hash).trim();
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

export const PLAYWRIGHT_DEV_DIR = path.join(process.cwd(), '.playwright-dev');
export const AUTH_STATE_PATH = path.join(PLAYWRIGHT_DEV_DIR, 'auth.json');
export const SCREENSHOTS_DIR = path.join(PLAYWRIGHT_DEV_DIR, 'screenshots');

/** @returns {string} */
export function getBaseUrl() {
  return (
    process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3001'
  );
}

/**
 * @param {string} routePath
 * @returns {string}
 */
export function normalizeRoutePath(routePath) {
  const trimmed = routePath.trim();
  if (!trimmed.startsWith('/')) {
    return `/${trimmed}`;
  }
  return trimmed;
}
