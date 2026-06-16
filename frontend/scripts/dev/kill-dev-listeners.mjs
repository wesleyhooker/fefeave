#!/usr/bin/env node
/**
 * Kill local dev listeners on known ports using ss + /proc (WSL-safe).
 *
 * Usage:
 *   node scripts/dev/kill-dev-listeners.mjs              # :3000 and :3001
 *   KILL_DEV_PORTS=3001 node scripts/dev/kill-dev-listeners.mjs
 */
import {
  getPidsOnPort,
  isNextDevPid,
  killPids,
  readCmdline,
} from './dev-port-procs.mjs';

const ports = (process.env.KILL_DEV_PORTS ?? '3000,3001')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((port) => Number.isFinite(port) && port > 0);

if (ports.length === 0) {
  console.error('kill-dev-listeners: no valid ports in KILL_DEV_PORTS');
  process.exit(1);
}

const targets = [];
for (const port of ports) {
  for (const pid of getPidsOnPort(port)) {
    targets.push({ port, pid, cmd: readCmdline(pid), next: isNextDevPid(pid) });
  }
}

const uniquePids = [...new Set(targets.map((target) => target.pid))];
const killed = killPids(uniquePids);

for (const target of targets) {
  if (killed.includes(target.pid)) {
    const kind = target.next ? 'next' : 'other';
    console.log(`Stopped pid ${target.pid} on :${target.port} (${kind})`);
  }
}
