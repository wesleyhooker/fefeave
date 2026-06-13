#!/usr/bin/env node
/**
 * Lightweight smoke: notifications bell dropdown on desktop + mobile.
 * Requires: running Next dev server, AUTH_DEV_BOOTSTRAP_SECRET.
 *
 * Usage: npm run playwright:notifications-bell-smoke
 */
import { chromium } from "playwright";
import { getBaseUrl, loadOptionalEnvLocal } from "./constants.mjs";

loadOptionalEnvLocal();
const baseUrl = getBaseUrl();

async function bootstrap(page, nextPath) {
  const secret = process.env.AUTH_DEV_BOOTSTRAP_SECRET?.trim();
  if (!secret) throw new Error("AUTH_DEV_BOOTSTRAP_SECRET missing");
  const u = new URL("/api/auth/dev-bootstrap", baseUrl);
  u.searchParams.set("secret", secret);
  u.searchParams.set("next", nextPath);
  await page.goto(u.toString(), { waitUntil: "load", timeout: 90000 });
  await page.goto(`${baseUrl}${nextPath}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle", { timeout: 60000 });
}

async function assertBellDropdown(page, label) {
  const bell = page.getByRole("button", { name: /^Notifications/i }).first();
  if ((await bell.count()) === 0) {
    throw new Error(`${label}: notifications bell button not found`);
  }

  await bell.click();
  const menu = page.locator("#workspace-notifications-menu");
  await menu.waitFor({ state: "visible", timeout: 10000 });

  const recent = menu.getByText("Recent updates", { exact: true });
  if ((await recent.count()) === 0) {
    throw new Error(`${label}: Recent updates section missing`);
  }

  const box = await menu.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) {
    throw new Error(`${label}: could not measure dropdown bounds`);
  }

  const overflowRight = box.x + box.width > viewport.width + 1;
  const overflowLeft = box.x < -1;
  if (overflowRight || overflowLeft) {
    throw new Error(
      `${label}: dropdown overflows viewport (x=${box.x}, w=${box.width}, vw=${viewport.width})`,
    );
  }

  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "hidden", timeout: 5000 });
}

const browser = await chromium.launch({ headless: true });
try {
  for (const { width, height, label } of [
    { width: 1280, height: 800, label: "desktop" },
    { width: 390, height: 844, label: "mobile" },
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: label === "mobile" ? 2 : 1,
      isMobile: label === "mobile",
      hasTouch: label === "mobile",
    });
    const page = await context.newPage();
    await bootstrap(page, "/admin/dashboard");
    await assertBellDropdown(page, label);
    await context.close();
  }

  console.log("Notifications bell smoke passed (desktop + mobile).");
} finally {
  await browser.close();
}
