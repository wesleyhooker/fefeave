#!/usr/bin/env node
import path from "node:path";
import { chromium } from "playwright";
import {
  SCREENSHOTS_DIR,
  getBaseUrl,
  loadOptionalEnvLocal,
} from "./constants.mjs";

loadOptionalEnvLocal();

function out(name) {
  return path.join(SCREENSHOTS_DIR, name);
}

async function bootstrap(page, baseUrl, nextPath) {
  const secret = process.env.AUTH_DEV_BOOTSTRAP_SECRET?.trim();
  if (!secret) throw new Error("AUTH_DEV_BOOTSTRAP_SECRET missing");
  const url = new URL("/api/auth/dev-bootstrap", baseUrl);
  url.searchParams.set("secret", secret);
  url.searchParams.set("next", nextPath);
  await page.goto(url.toString(), { waitUntil: "load", timeout: 90000 });
  await page.goto(`${baseUrl}${nextPath}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle", { timeout: 60000 });
  await page.waitForTimeout(180);
}

const baseUrl = getBaseUrl();
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1512, height: 982 },
  });
  const page = await context.newPage();

  // 1) Sidebar motion states (rest -> hover -> active/open page)
  await bootstrap(page, baseUrl, "/admin/shows");
  await page.screenshot({
    path: out("motion-sidebar-before-rest.png"),
    fullPage: true,
  });
  const balancesNav = page.locator('a[href="/admin/balances"]').first();
  await balancesNav.hover();
  await page.waitForTimeout(120);
  await page.screenshot({
    path: out("motion-sidebar-middle-hover.png"),
    fullPage: true,
  });
  await balancesNav.click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(180);
  await page.screenshot({
    path: out("motion-sidebar-after-active.png"),
    fullPage: true,
  });

  // 2) Header action / side panel (rest -> hover -> open)
  await page.goto(`${baseUrl}/admin/dashboard`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(180);
  const logShow = page.getByRole("button", { name: /log show/i }).first();
  await page.screenshot({
    path: out("motion-logshow-before-rest.png"),
    fullPage: true,
  });
  await logShow.hover();
  await page.waitForTimeout(120);
  await page.screenshot({
    path: out("motion-logshow-middle-hover.png"),
    fullPage: true,
  });
  await logShow.click();
  await page.waitForTimeout(260);
  await page.screenshot({
    path: out("motion-logshow-after-panel-open.png"),
    fullPage: true,
  });

  // 3) Clickable row behavior (rest -> hover -> opened detail page)
  await page.goto(`${baseUrl}/admin/shows`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(180);
  let rowLink = page
    .locator("table tbody tr td a[href^='/admin/shows/']:visible")
    .first();
  if ((await rowLink.count()) === 0) {
    await page.goto(`${baseUrl}/admin/balances`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(180);
    rowLink = page
      .locator("table tbody tr td a[href^='/admin/wholesalers/']:visible")
      .first();
  }
  if ((await rowLink.count()) > 0) {
    await page.screenshot({
      path: out("motion-row-before-rest.png"),
      fullPage: true,
    });
    await rowLink.hover();
    await page.waitForTimeout(120);
    await page.screenshot({
      path: out("motion-row-middle-hover.png"),
      fullPage: true,
    });
    await rowLink.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(180);
    await page.screenshot({
      path: out("motion-row-after-navigation.png"),
      fullPage: true,
    });
  }

  // 4) Modal behavior on show detail (rest -> trigger hover -> dialog open)
  const closeShowBtn = page.getByRole("button", { name: /^close show$/i }).first();
  const reopenBtn = page.getByRole("button", { name: /^reopen show/i }).first();
  const modalTrigger = (await closeShowBtn.count()) > 0 ? closeShowBtn : reopenBtn;
  if ((await modalTrigger.count()) > 0) {
    await modalTrigger.waitFor({ state: "visible", timeout: 10000 });
    await page.screenshot({
      path: out("motion-modal-before-rest.png"),
      fullPage: true,
    });
    await modalTrigger.hover();
    await page.waitForTimeout(120);
    await page.screenshot({
      path: out("motion-modal-middle-hover-trigger.png"),
      fullPage: true,
    });
    await modalTrigger.click();
    await page.waitForTimeout(220);
    await page.screenshot({
      path: out("motion-modal-after-open.png"),
      fullPage: true,
    });
  }

  // 5) Week accordion (rest -> hover -> expanded)
  await page.goto(`${baseUrl}/admin/shows`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(180);
  const weekSummary = page.locator("section details summary").first();
  if (await weekSummary.count()) {
    await page.screenshot({
      path: out("motion-accordion-before-rest.png"),
      fullPage: true,
    });
    await weekSummary.hover();
    await page.waitForTimeout(120);
    await page.screenshot({
      path: out("motion-accordion-middle-hover.png"),
      fullPage: true,
    });
    await weekSummary.click();
    await page.waitForTimeout(220);
    await page.screenshot({
      path: out("motion-accordion-after-open.png"),
      fullPage: true,
    });
  }

  console.log("admin-motion-states capture complete");
} finally {
  await browser.close();
}
