#!/usr/bin/env node
/**
 * Capture desktop + mobile /admin/shows screenshots for each workspace scenario.
 * Output: frontend/.playwright-dev/shows-scenario-review/
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

import {
  FRONTEND_PACKAGE_ROOT,
  getBaseUrl,
  loadOptionalEnvLocal,
  normalizeRoutePath,
} from "./constants.mjs";

loadOptionalEnvLocal();

const OUT_DIR = path.join(
  FRONTEND_PACKAGE_ROOT,
  ".playwright-dev",
  "shows-scenario-review",
);
const SCENARIOS = process.env.SCENARIO_FILTER
  ? process.env.SCENARIO_FILTER.trim().split(/\s+/)
  : [
  "shows-empty-week",
  "shows-typical-week",
  "shows-needs-close-out",
  "shows-busy-week",
];
const ROUTE = normalizeRoutePath("/admin/shows");

function canUseBootstrap() {
  return (
    process.env.AUTH_DEV_BOOTSTRAP_ENABLED === "1" &&
    Boolean(process.env.AUTH_DEV_BOOTSTRAP_SECRET?.trim())
  );
}

async function gotoAndSettle(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
  await page.waitForSelector("#shows-current-period-heading", { timeout: 30_000 });
  await page.waitForTimeout(500);
}

async function bootstrapAuth(page, baseUrl) {
  const secret = process.env.AUTH_DEV_BOOTSTRAP_SECRET.trim();
  const bootstrap = new URL("/api/auth/dev-bootstrap", baseUrl);
  bootstrap.searchParams.set("secret", secret);
  bootstrap.searchParams.set("next", ROUTE);
  const res = await page.goto(bootstrap.toString(), {
    waitUntil: "load",
    timeout: 90_000,
  });
  if (res && (res.status() === 403 || res.status() === 404)) {
    throw new Error(`dev-bootstrap failed: HTTP ${res.status()}`);
  }
}

function runScenario(scenarioId) {
  execSync(`make -C "${path.resolve(FRONTEND_PACKAGE_ROOT, "..")}" dev-scenario SCENARIO=${scenarioId}`, {
    stdio: "pipe",
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgres://fefeave:fefeave@localhost:5432/fefeave",
    },
  });
}

async function captureViewport(browser, baseUrl, scenarioId, label, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await bootstrapAuth(page, baseUrl);
  runScenario(scenarioId);
  await gotoAndSettle(page, `${baseUrl}${ROUTE}`);
  if (new URL(page.url()).pathname.startsWith("/login")) {
    throw new Error(`Not authenticated — still on login for ${scenarioId}`);
  }
  const outPath = path.join(OUT_DIR, `${scenarioId}-${label}.png`);
  await page.screenshot({ path: outPath, fullPage: true });
  await context.close();
  return outPath;
}

if (!canUseBootstrap()) {
  console.error(
    "AUTH_DEV_BOOTSTRAP_ENABLED=1 and AUTH_DEV_BOOTSTRAP_SECRET required in frontend/.env.local",
  );
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const baseUrl = getBaseUrl();
const browser = await chromium.launch({ headless: true });

try {
  for (const scenarioId of SCENARIOS) {
    const desktop = await captureViewport(
      browser,
      baseUrl,
      scenarioId,
      "desktop-1440",
      { width: 1440, height: 900 },
    );
    console.log("wrote", desktop);

    const mobile = await captureViewport(
      browser,
      baseUrl,
      scenarioId,
      "mobile-390",
      { width: 390, height: 844 },
    );
    console.log("wrote", mobile);
  }
  console.log(`\nAll screenshots in: ${OUT_DIR}`);
} finally {
  await browser.close();
}
