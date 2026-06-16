#!/usr/bin/env node
/**
 * Block starting a second local Next dev server that shares frontend/.next.
 *
 * Usage (local dev only — not used in CI or production builds):
 *   NEXT_DEV_PORT=3001 node scripts/dev/check-next-dev-singleton.mjs
 *   # then: next dev -p 3001
 *
 * Defaults NEXT_DEV_PORT to 3000 (plain `npm run dev`).
 */
import {
  getPidsOnPort,
  isNextDevPid,
} from './dev-port-procs.mjs';

const KNOWN_NEXT_DEV_PORTS = [3000, 3001];
const requestedPort = Number(process.env.NEXT_DEV_PORT ?? 3000);

if (!Number.isFinite(requestedPort) || requestedPort <= 0) {
  console.error(
    `next dev blocked: invalid NEXT_DEV_PORT="${process.env.NEXT_DEV_PORT}".`,
  );
  process.exit(1);
}

function portsWithNextDev() {
  const active = [];
  for (const port of KNOWN_NEXT_DEV_PORTS) {
    const pids = getPidsOnPort(port);
    if (pids.some(isNextDevPid)) {
      active.push(port);
    }
  }
  return active;
}

const activeNextPorts = portsWithNextDev();

if (activeNextPorts.includes(requestedPort)) {
  console.error(
    `\nnext dev blocked: port ${requestedPort} already has a Next dev server.\n` +
      'Stop the existing server before starting another:\n' +
      '  make dev-down\n' +
      '  make dev-reset-frontend\n',
  );
  process.exit(1);
}

if (activeNextPorts.length > 0) {
  console.error(
    `\nnext dev blocked: another Next dev server is already running on port(s) ${activeNextPorts.join(', ')}.\n` +
      `Starting a second server on port ${requestedPort} can corrupt frontend/.next.\n` +
      'Stop the existing server first:\n' +
      '  make dev-down\n' +
      '  make dev-reset-frontend\n' +
      '\nDo not run make dev-ui (:3001) and npm run dev / make ui-aws (:3000) at the same time.\n',
  );
  process.exit(1);
}

if (requestedPort === 3000) {
  const port3000Pids = getPidsOnPort(3000);
  const nonNextOn3000 = port3000Pids.filter((pid) => !isNextDevPid(pid));
  if (nonNextOn3000.length > 0) {
    console.error(
      '\nnext dev blocked: port 3000 is already in use (likely make dev-api backend).\n' +
        'Use the standard local UI instead:\n' +
        '  make dev-ui   # frontend on :3001 with /api proxy to :3000\n' +
        'Or stop the backend first:\n' +
        '  make dev-down\n',
    );
    process.exit(1);
  }
}
