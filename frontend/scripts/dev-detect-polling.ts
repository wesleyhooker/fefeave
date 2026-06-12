import { readFileSync } from 'fs';

/**
 * Whether dev servers should poll for file changes (WSL2 / cross-mount saves).
 * Set WATCHPACK_POLLING=false to disable auto-detection.
 */
export function devFilePollingEnabled(): boolean {
  if (process.env.WATCHPACK_POLLING === 'false') return false;
  if (
    process.env.WATCHPACK_POLLING === 'true' ||
    process.env.CHOKIDAR_USEPOLLING === 'true' ||
    process.env.FEFEAVE_DEV_POLL === '1'
  ) {
    return true;
  }
  if (process.platform !== 'linux') return false;
  try {
    return readFileSync('/proc/version', 'utf8')
      .toLowerCase()
      .includes('microsoft');
  } catch {
    return false;
  }
}

export function devPollingIntervalMs(): number {
  const n = Number(process.env.WATCHPACK_POLLING_INTERVAL);
  return Number.isFinite(n) && n > 0 ? n : 1000;
}
