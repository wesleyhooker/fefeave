/**
 * Shared ss + /proc helpers for local dev port/process detection.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';

export function getPidsOnPort(port) {
  try {
    const out = execSync(`ss -tlnpH 'sport = :${port}' 2>/dev/null || true`, {
      encoding: 'utf8',
    });
    const pids = new Set();
    for (const line of out.split('\n')) {
      const match = line.match(/pid=(\d+)/);
      if (match) pids.add(Number(match[1]));
    }
    return [...pids];
  } catch {
    return [];
  }
}

export function readCmdline(pid) {
  try {
    const raw = fs.readFileSync(`/proc/${pid}/cmdline`);
    return raw.toString('utf8').replace(/\0/g, ' ');
  } catch {
    return '';
  }
}

export function isNextDevPid(pid) {
  const cmd = readCmdline(pid);
  return /\bnext\s+dev\b/.test(cmd) || cmd.includes('next-server');
}

export function isPortListening(port) {
  return getPidsOnPort(port).length > 0;
}

export function killPids(pids, signal = 'SIGKILL') {
  const killed = [];
  for (const pid of pids) {
    try {
      process.kill(pid, signal);
      killed.push(pid);
    } catch {
      // already exited
    }
  }
  return killed;
}
