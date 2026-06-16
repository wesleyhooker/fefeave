#!/usr/bin/env node
/**
 * Diagnose Next.js dev cache health for local FefeAve frontend.
 *
 * Usage:
 *   node scripts/dev/diagnose-next-cache.mjs
 *   DEBUG_RUN_ID=post-fix node scripts/dev/diagnose-next-cache.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(THIS_DIR, '..', '..');
const NEXT_DIR = path.join(FRONTEND_ROOT, '.next');
const CLIENT_CACHE = path.join(
  NEXT_DIR,
  'cache',
  'webpack',
  'client-development',
);
const SERVER_CACHE = path.join(
  NEXT_DIR,
  'cache',
  'webpack',
  'server-development',
);

function logReport(entry) {
  const payload = {
    runId: process.env.DEBUG_RUN_ID ?? 'diagnose',
    timestamp: Date.now(),
    ...entry,
  };
  console.log(JSON.stringify(payload));
}

function countPacks(dir) {
  if (!fs.existsSync(dir)) return { exists: false, count: 0, sample: [] };
  const names = fs.readdirSync(dir).filter((n) => n.endsWith('.pack.gz'));
  return { exists: true, count: names.length, sample: names.slice(0, 3) };
}

const clientPacks = countPacks(CLIENT_CACHE);
const serverPacks = countPacks(SERVER_CACHE);

let routesManifest = false;
let pagesManifestApp = false;
let buildId = null;
try {
  routesManifest = fs.existsSync(path.join(NEXT_DIR, 'routes-manifest.json'));
  const pm = path.join(NEXT_DIR, 'server', 'pages-manifest.json');
  if (fs.existsSync(pm)) {
    const parsed = JSON.parse(fs.readFileSync(pm, 'utf8'));
    pagesManifestApp = typeof parsed['/_app'] === 'string';
  }
  const bid = path.join(NEXT_DIR, 'BUILD_ID');
  if (fs.existsSync(bid)) {
    buildId = fs.readFileSync(bid, 'utf8').trim();
  }
} catch {
  /* ignore */
}

let port3001 = false;
try {
  const { execSync } = await import('node:child_process');
  const ssOut = execSync(
    'ss -tlnH sport = :3001 2>/dev/null || lsof -t -iTCP:3001 -sTCP:LISTEN 2>/dev/null || true',
    { encoding: 'utf8' },
  ).trim();
  port3001 = Boolean(ssOut);
} catch {
  port3001 = false;
}

const healthy =
  port3001 &&
  fs.existsSync(NEXT_DIR) &&
  (clientPacks.count > 0 || serverPacks.count > 0);

logReport({
  location: 'diagnose-next-cache.mjs:summary',
  message: 'next dev cache health',
  data: {
    healthy,
    nextExists: fs.existsSync(NEXT_DIR),
    frontendRoot: FRONTEND_ROOT,
    clientPacks,
    serverPacks,
    routesManifest,
    pagesManifestApp,
    buildId,
    port3001,
    hint: healthy
      ? null
      : 'Run make dev-reset-frontend (or make dev-down && rm -rf frontend/.next && make dev)',
  },
});

process.exit(healthy ? 0 : 1);
