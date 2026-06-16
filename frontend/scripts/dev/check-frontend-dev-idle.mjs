#!/usr/bin/env node
/**
 * Refuse production build while the Next dev server is listening on :3001.
 * Prevents mixed prod/dev `.next` state and stale dev cache corruption.
 */
import { execSync } from 'node:child_process';

let listening = false;
try {
  const out = execSync(
    'ss -tlnH sport = :3001 2>/dev/null || lsof -t -iTCP:3001 -sTCP:LISTEN 2>/dev/null || true',
    { encoding: 'utf8' },
  ).trim();
  listening = Boolean(out);
} catch {
  listening = false;
}

if (listening) {
  console.error(
    '\nfrontend build blocked: Next dev server is still running on port 3001.\n' +
      'Stop it first to avoid corrupting `.next`:\n' +
      '  make dev-reset-frontend\n' +
      '  # or: kill the UI process, then npm run build\n' +
      '\nNever run `npm run build` while `make dev` frontend is still alive.\n',
  );
  process.exit(1);
}
