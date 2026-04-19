#!/usr/bin/env node
/**
 * Capture a screenshot of a local route using dev bootstrap (preferred) or saved storage state.
 */
import fs from 'node:fs';
import path from 'node:path';

import { chromium } from 'playwright';

import {
  AUTH_STATE_PATH,
  SCREENSHOTS_DIR,
  getBaseUrl,
  loadOptionalEnvLocal,
  normalizeRoutePath,
} from './constants.mjs';

loadOptionalEnvLocal();

function printUsage() {
  console.log(`
Usage:
  npm run playwright:screenshot -- <route> [filename.png]

Default auth (recommended for make dev):
  Uses /api/auth/dev-bootstrap when AUTH_DEV_BOOTSTRAP_ENABLED=1 and AUTH_DEV_BOOTSTRAP_SECRET
  are set in frontend/.env.local (see docs/DEV.md).

Options:
  --full          Full-page screenshot (default)
  --viewport      Viewport-only screenshot
  --storage       Use saved Playwright storage only (${AUTH_STATE_PATH})
  --no-bootstrap  Same as --storage

Environment:
  PLAYWRIGHT_BASE_URL           App origin (default http://localhost:3001)
  AUTH_DEV_BOOTSTRAP_ENABLED    Must be 1 for bootstrap
  AUTH_DEV_BOOTSTRAP_SECRET     Must match between .env.local and bootstrap URL

Fallback:
  If bootstrap is not configured, uses .playwright-dev/auth.json from playwright:save-auth.
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let fullPage = true;
  let forceStorage = false;
  const positional = [];

  for (const a of args) {
    if (a === '--full') {
      fullPage = true;
    } else if (a === '--viewport') {
      fullPage = false;
    } else if (a === '--storage' || a === '--no-bootstrap') {
      forceStorage = true;
    } else if (a === '-h' || a === '--help') {
      return { help: true };
    } else {
      positional.push(a);
    }
  }

  if (positional.length === 0) {
    return { error: 'Missing route (e.g. /admin/dashboard)' };
  }

  const routeArg = positional[0];
  const outName = positional[1];

  return {
    routePath: normalizeRoutePath(routeArg),
    outName: outName || null,
    fullPage,
    forceStorage,
  };
}

function canUseBootstrap() {
  return (
    process.env.AUTH_DEV_BOOTSTRAP_ENABLED === '1' &&
    Boolean(process.env.AUTH_DEV_BOOTSTRAP_SECRET?.trim())
  );
}

function readBootstrapErrorBody(text) {
  try {
    const j = JSON.parse(text);
    if (j && typeof j.message === 'string') return j.message;
  } catch {
    /* ignore */
  }
  return text.slice(0, 500);
}

const parsed = parseArgs(process.argv);
if ('help' in parsed && parsed.help) {
  printUsage();
  process.exit(0);
}
if ('error' in parsed && parsed.error) {
  console.error(parsed.error);
  printUsage();
  process.exit(1);
}

const baseUrl = getBaseUrl();
const { routePath, outName, fullPage, forceStorage } = parsed;

const useBootstrap = !forceStorage && canUseBootstrap();
const hasStorageFile = fs.existsSync(AUTH_STATE_PATH);

if (!useBootstrap && !hasStorageFile) {
  console.error(
    `No auth method available.\n\n` +
      `Option A (recommended with make dev): add to frontend/.env.local:\n` +
      `  AUTH_DEV_BOOTSTRAP_ENABLED=1\n` +
      `  AUTH_DEV_BOOTSTRAP_SECRET=<long random string>\n` +
      `Use the same secret when calling the bootstrap URL (Playwright passes it automatically).\n\n` +
      `Option B: run npm run playwright:save-auth once to create:\n` +
      `  ${AUTH_STATE_PATH}\n` +
      `Then run with --storage\n`,
  );
  process.exit(1);
}

if (forceStorage && !hasStorageFile) {
  console.error(
    `Auth state not found:\n  ${AUTH_STATE_PATH}\n\n` +
      'Run: npm run playwright:save-auth\n',
  );
  process.exit(1);
}

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
let fileName;
if (!outName) {
  fileName = `capture-${stamp}.png`;
} else {
  fileName = outName.endsWith('.png') ? outName : `${outName}.png`;
}
const outPath = path.join(SCREENSHOTS_DIR, path.basename(fileName));

const targetUrl = `${baseUrl}${routePath}`;

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext(
    useBootstrap
      ? {}
      : {
          storageState: AUTH_STATE_PATH,
        },
  );
  const page = await context.newPage();

  if (useBootstrap) {
    const secret = process.env.AUTH_DEV_BOOTSTRAP_SECRET.trim();
    const bootstrap = new URL('/api/auth/dev-bootstrap', baseUrl);
    bootstrap.searchParams.set('secret', secret);
    bootstrap.searchParams.set('next', routePath);

    const res = await page.goto(bootstrap.toString(), {
      waitUntil: 'load',
      timeout: 90_000,
    });

    if (res && res.status() === 404) {
      console.error(
        'Dev bootstrap returned 404. Set AUTH_DEV_BOOTSTRAP_ENABLED=1 and AUTH_DEV_BOOTSTRAP_SECRET in frontend/.env.local (see docs/DEV.md).',
      );
      process.exit(1);
    }
    if (res && res.status() === 403) {
      const body = await res.text();
      console.error(
        'Dev bootstrap failed:',
        readBootstrapErrorBody(body || ''),
      );
      process.exit(1);
    }
    if (res && (res.status() === 503 || res.status() === 500)) {
      const body = await res.text();
      console.error(
        'Dev bootstrap unavailable:',
        readBootstrapErrorBody(body || ''),
      );
      process.exit(1);
    }

    const res2 = await page.goto(targetUrl, {
      waitUntil: 'load',
      timeout: 60_000,
    });
    if (!res2 || !res2.ok()) {
      const status = res2 ? res2.status() : 'no response';
      console.warn(`Warning: HTTP ${status} for ${targetUrl}`);
    }
  } else {
    const res = await page.goto(targetUrl, {
      waitUntil: 'load',
      timeout: 60_000,
    });
    if (!res || !res.ok()) {
      const status = res ? res.status() : 'no response';
      console.warn(`Warning: HTTP ${status} for ${targetUrl}`);
    }
  }

  const pathAfter = new URL(page.url()).pathname;
  if (pathAfter.startsWith('/login')) {
    console.error(
      'Aborted: still on /login — no authenticated session. Fix bootstrap env, backend dev_bypass, or use npm run playwright:save-auth with --storage.',
    );
    process.exit(1);
  }

  await page.screenshot({ path: outPath, fullPage });

  const mode = useBootstrap ? 'bootstrap' : 'storageState';
  console.log(
    `Screenshot saved (${mode}):\n  ${outPath}\nTarget:\n  ${targetUrl}`,
  );
} finally {
  await browser.close();
}
