#!/usr/bin/env node
import path from "node:path";
import { chromium } from "playwright";
import {
  SCREENSHOTS_DIR,
  getBaseUrl,
  loadOptionalEnvLocal,
} from "./constants.mjs";

loadOptionalEnvLocal();

const baseUrl = getBaseUrl();

function out(name) {
  return path.join(SCREENSHOTS_DIR, name);
}

async function bootstrapAuth(page, nextPath) {
  const secret = process.env.AUTH_DEV_BOOTSTRAP_SECRET?.trim();
  if (!secret) throw new Error("AUTH_DEV_BOOTSTRAP_SECRET missing");
  const url = new URL("/api/auth/dev-bootstrap", baseUrl);
  url.searchParams.set("secret", secret);
  url.searchParams.set("next", nextPath);
  const res = await page.goto(url.toString(), {
    waitUntil: "load",
    timeout: 90000,
  });
  if (!res || !res.ok()) {
    throw new Error(`Bootstrap failed: ${res ? res.status() : "no response"}`);
  }
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 60000 });
  await page.waitForTimeout(180);
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1512, height: 982 },
  });
  const page = await context.newPage();

  await bootstrapAuth(page, "/admin/shows");
  await settle(page);

  await page.screenshot({
    path: out("motion-after-01-rest-shows.png"),
    fullPage: true,
  });

  const sidebarShows = page.locator('a[href="/admin/shows"]').first();
  await sidebarShows.waitFor({ state: "visible", timeout: 8000 });
  await sidebarShows.hover();
  await page.waitForTimeout(120);
  await page.screenshot({
    path: out("motion-after-02-hover-sidebar.png"),
    fullPage: true,
  });

  const logShow = page.getByRole("button", { name: /log show/i }).first();
  await logShow.waitFor({ state: "visible", timeout: 8000 });
  await logShow.hover();
  await page.waitForTimeout(120);
  await page.screenshot({
    path: out("motion-after-03-hover-log-show.png"),
    fullPage: true,
  });

  await logShow.click();
  await page.waitForTimeout(260);
  await page.screenshot({
    path: out("motion-after-04-open-side-panel.png"),
    fullPage: true,
  });

  await page.screenshot({
    path: out("motion-after-05-post-panel-shows.png"),
    fullPage: true,
  });

  const firstPastWeek = page.locator("section details > summary").first();
  if (await firstPastWeek.count()) {
    await firstPastWeek.hover();
    await page.waitForTimeout(120);
    await page.screenshot({
      path: out("motion-after-06-hover-week-row.png"),
      fullPage: true,
    });
    await firstPastWeek.click();
    await page.waitForTimeout(220);
    await page.screenshot({
      path: out("motion-after-07-open-week-row.png"),
      fullPage: true,
    });
  }

  console.log("motion-capture complete");
} finally {
  await browser.close();
}
