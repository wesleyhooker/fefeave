#!/usr/bin/env node
/**
 * Optional fallback: headed browser + real Cognito login, then save storage for
 * playwright:screenshot -- --storage. Prefer dev-bootstrap + AUTH_DEV_BOOTSTRAP_*
 * (see docs/DEV.md) when using make dev + dev_bypass API.
 * Dev-only; does not change production auth.
 */
import fs from 'node:fs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { chromium } from 'playwright';

import {
  AUTH_STATE_PATH,
  PLAYWRIGHT_DEV_DIR,
  getBaseUrl,
  loadOptionalEnvLocal,
} from './constants.mjs';

loadOptionalEnvLocal();

const baseUrl = getBaseUrl();
const loginUrl = `${baseUrl}/login`;

console.log(`
FefeAve — save local Playwright auth (dev-only)
==============================================

Prerequisites:
  • Frontend running:  ${baseUrl}   (e.g. make dev-ui from repo root)
  • Cognito / session:  valid frontend/.env.local — see frontend/AUTH_SETUP.md

What happens:
  1. A browser window opens on the login page.
  2. Sign in with your normal flow until you reach the admin UI.
  3. Return here and press Enter to save session cookies to:
     ${AUTH_STATE_PATH}

This file is gitignored. Re-run this script if your session expires.
`);

const rl = readline.createInterface({ input, output });

try {
  fs.mkdirSync(PLAYWRIGHT_DEV_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

  await rl.question(
    'When you are logged in and see the admin UI, press Enter here to save auth… ',
  );

  await context.storageState({ path: AUTH_STATE_PATH });
  await browser.close();

  console.log(`\nSaved auth state to ${AUTH_STATE_PATH}`);
  console.log(
    'Next: npm run playwright:screenshot -- --storage /admin/<your-route>\n',
  );
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  rl.close();
}
