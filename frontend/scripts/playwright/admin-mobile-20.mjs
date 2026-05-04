#!/usr/bin/env node
/**
 * Captures 20 full-page mobile viewport screenshots (390×844, 2x DPR).
 * Requires: running Next dev server, AUTH_DEV_BOOTSTRAP_SECRET.
 *
 * Output: frontend/.playwright-dev/screenshots/m-01-*.png … m-20-*.png
 */
import fs from "node:fs";
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

function clearOld(prefix = "m-") {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  for (const name of fs.readdirSync(SCREENSHOTS_DIR)) {
    if (name.startsWith(prefix) && name.endsWith(".png")) {
      fs.unlinkSync(path.join(SCREENSHOTS_DIR, name));
    }
  }
}

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
  await page.waitForTimeout(200);
}

async function snap(page, idx, label) {
  const n = String(idx).padStart(2, "0");
  await page.screenshot({
    path: out(`m-${n}-${label}.png`),
    fullPage: true,
  });
}

async function gotoReady(page, routePath) {
  await page.goto(`${baseUrl}${routePath}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle", { timeout: 60000 });
  await page.waitForTimeout(200);
}

async function openMobileMenu(page) {
  const menu = page.getByRole("button", { name: "Open menu" });
  if (await menu.count()) await menu.click();
  await page.waitForTimeout(280);
}

const browser = await chromium.launch({ headless: true });
try {
  clearOld("m-");
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await bootstrap(page, "/admin/dashboard");

  const showsRes = await page.request.get(`${baseUrl}/api/shows`);
  const showsJson = await showsRes.json();
  const showId =
    Array.isArray(showsJson) && showsJson[0]?.id ? showsJson[0].id : null;

  const wholesalersRes = await page.request.get(`${baseUrl}/api/wholesalers`);
  const wholesalersJson = await wholesalersRes.json();
  const wholesalerId =
    Array.isArray(wholesalersJson) && wholesalersJson[0]?.id
      ? wholesalersJson[0].id
      : null;

  let i = 1;

  await gotoReady(page, "/admin/dashboard");
  await snap(page, i++, "dashboard");

  await openMobileMenu(page);
  await snap(page, i++, "sidebar-open");

  await page
    .getByRole("dialog", { name: "Admin menu" })
    .getByRole("link", { name: /^shows$/i })
    .click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(200);
  await snap(page, i++, "shows-index");

  const weekRow = page.locator("section details summary").first();
  if (await weekRow.count()) {
    await weekRow.click();
    await page.waitForTimeout(260);
    await snap(page, i++, "shows-week-expanded");
  } else {
    await snap(page, i++, "shows-week-row-absent");
  }

  if (showId) {
    await gotoReady(page, `/admin/shows/${showId}`);
    await snap(page, i++, "show-detail");
    const settlementBtn = page
      .getByRole("button", { name: /add settlement/i })
      .first();
    if (await settlementBtn.count()) {
      await settlementBtn.click();
      await page.waitForTimeout(280);
      await snap(page, i++, "show-detail-add-settlement");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    } else {
      await snap(page, i++, "show-detail-no-settlement-dialog");
    }
  } else {
    await snap(page, i++, "show-detail-skipped");
    await snap(page, i++, "show-detail-skipped-2");
  }

  await gotoReady(page, "/admin/balances");
  await snap(page, i++, "balances");

  if (wholesalerId) {
    const vendorLink = page.locator(`a[href="/admin/wholesalers/${wholesalerId}"]`);
    if (await vendorLink.count()) {
      await vendorLink.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(160);
      await snap(page, i++, "balances-vendor-card");
    } else {
      await snap(page, i++, "balances-vendor-link-missing");
    }
  } else {
    await snap(page, i++, "balances-no-wholesaler-id");
  }

  if (wholesalerId) {
    await gotoReady(page, `/admin/wholesalers/${wholesalerId}`);
    await snap(page, i++, "wholesaler-detail");

    const ledgerHeading = page.locator("#wholesaler-ledger-heading");
    if (await ledgerHeading.count()) {
      await ledgerHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
    }
    await snap(page, i++, "wholesaler-ledger");

    const expenseTab = page.getByRole("button", { name: /^expense$/i });
    if (await expenseTab.count()) {
      await expenseTab.click();
      await page.waitForTimeout(220);
      await snap(page, i++, "wholesaler-expense-tab");
    } else {
      await snap(page, i++, "wholesaler-expense-tab-missing");
    }

    await gotoReady(page, `/admin/wholesalers/${wholesalerId}/batch-pay`);
    await snap(page, i++, "balance-breakdown");

    await gotoReady(page, `/admin/wholesalers/${wholesalerId}`);
    const payTab = page.getByRole("button", { name: /^payment$/i });
    if (await payTab.count()) {
      await payTab.click();
      await page.waitForTimeout(220);
    }
    await snap(page, i++, "wholesaler-payment-tab");
  } else {
    await snap(page, i++, "wholesaler-detail-skipped");
    await snap(page, i++, "wholesaler-ledger-skipped");
    await snap(page, i++, "wholesaler-tabs-skipped");
    await snap(page, i++, "balance-breakdown-skipped");
    await snap(page, i++, "wholesaler-payment-tab-skipped");
  }

  await gotoReady(page, "/admin/payments");
  await snap(page, i++, "payments-index");

  await gotoReady(page, "/admin/payments/new");
  await snap(page, i++, "record-payment");

  await gotoReady(page, "/admin/inventory");
  await snap(page, i++, "inventory");

  await gotoReady(page, "/admin/dashboard");
  const logShow = page.getByRole("button", { name: /log show/i }).first();
  if (await logShow.count()) {
    await logShow.click();
    await page.waitForTimeout(300);
    await snap(page, i++, "dashboard-log-show");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  } else {
    await snap(page, i++, "dashboard-log-show-absent");
  }

  const markPaid = page.getByRole("button", { name: /mark paid/i }).first();
  if (await markPaid.count()) {
    await markPaid.click();
    await page.waitForTimeout(300);
    await snap(page, i++, "dashboard-mark-paid");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  } else {
    await snap(page, i++, "dashboard-mark-paid-absent");
  }

  await gotoReady(page, "/admin/wholesalers");
  await snap(page, i++, "wholesalers-index");

  await gotoReady(page, "/admin");
  await snap(page, i++, "admin-home");

  if (i !== 21) {
    throw new Error(`Expected 20 screenshots, got ${i - 1}`);
  }

  console.log(`Captured 20 mobile screenshots in ${SCREENSHOTS_DIR}`);
} finally {
  await browser.close();
}
