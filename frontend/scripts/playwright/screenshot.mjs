#!/usr/bin/env node
/**
 * Capture PNG screenshots of local routes (dev-bootstrap or saved storage).
 *
 * Output (only): `<repo>/frontend/.playwright-dev/screenshots/` — see SCREENSHOTS_DIR in constants.mjs
 * (anchored to this package, not process.cwd()).
 *
 * One command clears that folder once, then writes one or more PNGs.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

import {
  AUTH_STATE_PATH,
  FRONTEND_PACKAGE_ROOT,
  SCREENSHOTS_DIR,
  getBaseUrl,
  loadOptionalEnvLocal,
  normalizeRoutePath,
} from "./constants.mjs";

loadOptionalEnvLocal();

function printUsage() {
  console.log(`
Usage:
  npm run playwright:screenshot -- <route> [output.png]
  npm run playwright:screenshot -- <route1> <out1.png> <route2> <out2.png> ...

  • One argument: one screenshot, auto-named capture-<timestamp>-<route-slug>-0.png
  • Two or more arguments: must be pairs (route, output.png) for each capture.

Examples:
  npm run playwright:screenshot -- /admin/dashboard
  npm run playwright:screenshot -- /admin/dashboard dash.png /admin/shows shows.png

Options:
  --full          Full-page screenshot (default)
  --viewport      Viewport-only screenshot
  --storage       Use saved Playwright storage only (${AUTH_STATE_PATH})
  --no-bootstrap  Same as --storage

Environment:
  PLAYWRIGHT_BASE_URL              App origin (default http://localhost:3001)
  AUTH_DEV_BOOTSTRAP_ENABLED       Must be 1 for bootstrap
  AUTH_DEV_BOOTSTRAP_SECRET        Must match frontend/.env.local
  PLAYWRIGHT_SCREENSHOT_NO_OPEN    Set to 1 to skip opening Explorer after success
  CI                               When set, skips Explorer

Screenshots directory (fixed):
  ${SCREENSHOTS_DIR}
`);
}

/**
 * @returns {{ help?: true, error?: string, captures?: { route: string, outBasename: string | null }[], fullPage: boolean, forceStorage: boolean }}
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  let fullPage = true;
  let forceStorage = false;
  const positional = [];

  for (const a of args) {
    if (a === "--full") {
      fullPage = true;
    } else if (a === "--viewport") {
      fullPage = false;
    } else if (a === "--storage" || a === "--no-bootstrap") {
      forceStorage = true;
    } else if (a === "-h" || a === "--help") {
      return { help: true };
    } else {
      positional.push(a);
    }
  }

  if (positional.length === 0) {
    return {
      error:
        "Missing route(s). Example: npm run playwright:screenshot -- /admin/dashboard",
    };
  }

  /** @type {{ route: string, outBasename: string | null }[]} */
  const captures = [];

  if (positional.length === 1) {
    captures.push({
      route: normalizeRoutePath(positional[0]),
      outBasename: null,
    });
  } else if (positional.length % 2 === 0) {
    for (let i = 0; i < positional.length; i += 2) {
      captures.push({
        route: normalizeRoutePath(positional[i]),
        outBasename: path.basename(positional[i + 1]),
      });
    }
  } else {
    return {
      error:
        "Invalid arguments: use one route, or pairs of <route> <output.png> for each capture.",
    };
  }

  return { captures, fullPage, forceStorage };
}

function canUseBootstrap() {
  return (
    process.env.AUTH_DEV_BOOTSTRAP_ENABLED === "1" &&
    Boolean(process.env.AUTH_DEV_BOOTSTRAP_SECRET?.trim())
  );
}

function readBootstrapErrorBody(text) {
  try {
    const j = JSON.parse(text);
    if (j && typeof j.message === "string") return j.message;
  } catch {
    /* ignore */
  }
  return text.slice(0, 500);
}

/**
 * Navigate and wait until the page is likely past skeleton-only state.
 */
async function gotoAndSettleForScreenshot(page, url) {
  const res = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForLoadState("networkidle", { timeout: 60_000 });
  await page.waitForTimeout(300);
  try {
    await page
      .locator("main")
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
  } catch {
    /* optional */
  }
  try {
    await page
      .locator('aside[aria-label="Admin navigation"]')
      .waitFor({ state: "visible", timeout: 15_000 });
  } catch {
    /* optional: non-admin routes */
  }
  return res;
}

/** Create dir, remove files only (not subdirs). Logs on failure; does not throw. */
function clearScreenshotsDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    console.warn(
      "playwright:screenshot — could not create screenshots directory:",
      err instanceof Error ? err.message : err,
    );
    return;
  }
  try {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      try {
        if (fs.statSync(p).isFile()) {
          fs.unlinkSync(p);
        }
      } catch (err) {
        console.warn(
          `playwright:screenshot — could not remove ${p}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  } catch (err) {
    console.warn(
      "playwright:screenshot — could not clear screenshots directory:",
      err instanceof Error ? err.message : err,
    );
  }
}

function shouldOpenScreenshotsFolderInExplorer() {
  if (process.env.CI) {
    return false;
  }
  if (process.env.PLAYWRIGHT_SCREENSHOT_NO_OPEN === "1") {
    return false;
  }
  return true;
}

function openScreenshotsFolderInExplorer() {
  if (!shouldOpenScreenshotsFolderInExplorer()) {
    console.log(
      "playwright:screenshot — Explorer: skipped (set CI or PLAYWRIGHT_SCREENSHOT_NO_OPEN=1).",
    );
    return;
  }
  const dirAbs = path.resolve(SCREENSHOTS_DIR);
  try {
    const winPath = execFileSync("wslpath", ["-w", dirAbs], {
      encoding: "utf8",
    }).trim();
    if (!winPath) {
      console.warn(
        "playwright:screenshot — Explorer: wslpath returned empty; not opening.",
      );
      return;
    }
    const result = spawnSync("explorer.exe", [winPath], {
      stdio: "ignore",
      windowsHide: true,
    });
    if (result.error) {
      console.warn(
        "playwright:screenshot — Explorer: failed to spawn:",
        result.error.message,
      );
      return;
    }
    console.log(
      `playwright:screenshot — Explorer: launched for Windows path: ${winPath}`,
    );
    console.log(
      "playwright:screenshot — (If no window appears, check WSL interop / an existing Explorer window.)",
    );
  } catch (err) {
    console.warn(
      "playwright:screenshot — Explorer: error (wslpath or Explorer not available?):",
      err instanceof Error ? err.message : err,
    );
  }
}

function resolveOutputBasename(
  capture,
  /** @type {number} */ index,
  /** @type {string} */ stamp,
) {
  if (capture.outBasename) {
    const b = capture.outBasename;
    return b.endsWith(".png") ? b : `${b}.png`;
  }
  const slug = capture.route
    .replace(/^\//, "")
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 80);
  return `capture-${stamp}-${slug || "page"}-${index}.png`;
}

const parsed = parseArgs(process.argv);
if ("help" in parsed && parsed.help) {
  printUsage();
  process.exit(0);
}
if ("error" in parsed && parsed.error) {
  console.error(parsed.error);
  printUsage();
  process.exit(1);
}

const { captures, fullPage, forceStorage } = parsed;
if (!captures || captures.length === 0) {
  console.error("Internal error: no captures.");
  process.exit(1);
}

const baseUrl = getBaseUrl();
const useBootstrap = !forceStorage && canUseBootstrap();
const hasStorageFile = fs.existsSync(AUTH_STATE_PATH);

if (!useBootstrap && !hasStorageFile) {
  console.error(
    `No auth method available.\n\n` +
      `Option A (recommended with make dev): add to frontend/.env.local:\n` +
      `  AUTH_DEV_BOOTSTRAP_ENABLED=1\n` +
      `  AUTH_DEV_BOOTSTRAP_SECRET=<long random string>\n\n` +
      `Option B: run npm run playwright:save-auth once to create:\n` +
      `  ${AUTH_STATE_PATH}\n` +
      `Then run with --storage\n`,
  );
  process.exit(1);
}

if (forceStorage && !hasStorageFile) {
  console.error(
    `Auth state not found:\n  ${AUTH_STATE_PATH}\n\n` +
      "Run: npm run playwright:save-auth\n",
  );
  process.exit(1);
}

clearScreenshotsDir(SCREENSHOTS_DIR);

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const writtenFiles = [];

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
    const bootstrap = new URL("/api/auth/dev-bootstrap", baseUrl);
    bootstrap.searchParams.set("secret", secret);
    bootstrap.searchParams.set("next", captures[0].route);

    const res = await page.goto(bootstrap.toString(), {
      waitUntil: "load",
      timeout: 90_000,
    });

    if (res && res.status() === 404) {
      console.error(
        "Dev bootstrap returned 404. Set AUTH_DEV_BOOTSTRAP_ENABLED=1 and AUTH_DEV_BOOTSTRAP_SECRET in frontend/.env.local (see docs/DEV.md).",
      );
      process.exit(1);
    }
    if (res && res.status() === 403) {
      const body = await res.text();
      console.error(
        "Dev bootstrap failed:",
        readBootstrapErrorBody(body || ""),
      );
      process.exit(1);
    }
    if (res && (res.status() === 503 || res.status() === 500)) {
      const body = await res.text();
      console.error(
        "Dev bootstrap unavailable:",
        readBootstrapErrorBody(body || ""),
      );
      process.exit(1);
    }
  }

  for (let i = 0; i < captures.length; i++) {
    const cap = captures[i];
    const targetUrl = `${baseUrl}${cap.route}`;
    const navRes = await gotoAndSettleForScreenshot(page, targetUrl);
    if (!navRes || !navRes.ok()) {
      const status = navRes ? navRes.status() : "no response";
      console.warn(`Warning: HTTP ${status} for ${targetUrl}`);
    }

    const pathAfter = new URL(page.url()).pathname;
    if (pathAfter.startsWith("/login")) {
      console.error(
        "Aborted: still on /login — no authenticated session. Fix bootstrap env, backend dev_bypass, or use npm run playwright:save-auth with --storage.",
      );
      process.exit(1);
    }

    const basename = resolveOutputBasename(cap, i, stamp);
    const outPath = path.join(SCREENSHOTS_DIR, basename);
    await page.screenshot({ path: outPath, fullPage });
    writtenFiles.push(basename);
  }

  const mode = useBootstrap ? "bootstrap" : "storageState";
  console.log(`playwright:screenshot — done (${mode})`);
  console.log(
    `playwright:screenshot — frontend root: ${FRONTEND_PACKAGE_ROOT}`,
  );
  console.log(`playwright:screenshot — output directory: ${SCREENSHOTS_DIR}`);
  console.log("playwright:screenshot — files written:");
  for (const f of writtenFiles) {
    console.log(`  ${path.join(SCREENSHOTS_DIR, f)}`);
  }

  openScreenshotsFolderInExplorer();
} finally {
  await browser.close();
}
