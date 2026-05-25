#!/usr/bin/env node
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

function clearOld(prefix = "wf-") {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  for (const name of fs.readdirSync(SCREENSHOTS_DIR)) {
    if (name.startsWith(prefix)) {
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
  await page.waitForTimeout(180);
}

async function snap(page, idx, label) {
  const n = String(idx).padStart(2, "0");
  const file = `wf-${n}-${label}.png`;
  await page.screenshot({ path: out(file), fullPage: true });
}

const browser = await chromium.launch({ headless: true });
try {
  clearOld("wf-");
  const context = await browser.newContext({
    viewport: { width: 1512, height: 982 },
  });
  const page = await context.newPage();

  // Resolve dynamic ids for detail pages.
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

  // Dashboard workflow + interactions
  await page.goto(`${baseUrl}/admin/dashboard`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle");
  await snap(page, i++, "dashboard-rest");
  const logShow = page.getByRole("button", { name: /log show/i }).first();
  await logShow.hover();
  await page.waitForTimeout(120);
  await snap(page, i++, "dashboard-hover-log-show");
  await logShow.click();
  await page.waitForTimeout(240);
  await snap(page, i++, "dashboard-side-panel-open");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(180);
  const markPaid = page.getByRole("button", { name: /mark paid/i }).first();
  if (await markPaid.count()) {
    await markPaid.hover();
    await page.waitForTimeout(120);
    await snap(page, i++, "dashboard-hover-mark-paid");
    await markPaid.click();
    await page.waitForTimeout(240);
    await snap(page, i++, "dashboard-mark-paid-modal");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(160);
  }

  // Shows index + interactions
  await page.goto(`${baseUrl}/admin/shows`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await snap(page, i++, "shows-rest");
  const weekRow = page.locator("section details summary").first();
  if (await weekRow.count()) {
    await weekRow.hover();
    await page.waitForTimeout(120);
    await snap(page, i++, "shows-hover-past-week-row");
    await weekRow.click();
    await page.waitForTimeout(240);
    await snap(page, i++, "shows-open-past-week-row");
  } else {
    await snap(page, i++, "shows-no-past-week-row");
    await snap(page, i++, "shows-fallback-state");
  }

  // Shows detail
  if (showId) {
    await page.goto(`${baseUrl}/admin/shows/${showId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle");
    await snap(page, i++, "show-detail-rest");
    const settlementAdd = page
      .getByRole("button", { name: /add settlement/i })
      .first();
    if (await settlementAdd.count()) {
      await settlementAdd.hover();
      await page.waitForTimeout(120);
      await snap(page, i++, "show-detail-hover-add-settlement");
    } else {
      await snap(page, i++, "show-detail-empty-settlement-state");
    }
    const closeShow = page
      .getByRole("button", { name: /^close show$/i })
      .first();
    if (await closeShow.count()) {
      await closeShow.click();
      await page.waitForTimeout(240);
      await snap(page, i++, "show-detail-close-modal");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(160);
    } else {
      const reopen = page
        .getByRole("button", { name: /^reopen show/i })
        .first();
      if (await reopen.count()) {
        await reopen.click();
        await page.waitForTimeout(240);
        await snap(page, i++, "show-detail-reopen-modal");
        await page.keyboard.press("Escape");
        await page.waitForTimeout(160);
      } else {
        await snap(page, i++, "show-detail-summary");
      }
    }
  } else {
    await snap(page, i++, "show-detail-unavailable");
    await snap(page, i++, "show-detail-unavailable-2");
    await snap(page, i++, "show-detail-unavailable-3");
  }

  // Balances
  await page.goto(`${baseUrl}/admin/balances`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle");
  await snap(page, i++, "balances-rest");
  const balRow = page.locator("tbody tr[role='link']").first();
  if (await balRow.count()) {
    await balRow.hover();
    await page.waitForTimeout(120);
    await snap(page, i++, "balances-hover-row");
  } else {
    await snap(page, i++, "balances-empty");
  }

  // Wholesalers + detail + batch pay
  await page.goto(`${baseUrl}/admin/wholesalers`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle");
  await snap(page, i++, "wholesalers-index");

  if (wholesalerId) {
    await page.goto(`${baseUrl}/admin/wholesalers/${wholesalerId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle");
    await snap(page, i++, "wholesaler-detail");
    await page.goto(`${baseUrl}/admin/wholesalers/${wholesalerId}/batch-pay`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle");
    await snap(page, i++, "wholesaler-batch-pay");
  } else {
    await snap(page, i++, "wholesaler-detail-unavailable");
    await snap(page, i++, "wholesaler-batch-pay-unavailable");
  }

  // Payments + inventory + admin home
  await page.goto(`${baseUrl}/admin/payments`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle");
  await snap(page, i++, "payments-index");
  await page.goto(`${baseUrl}/admin/payments/new`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle");
  await snap(page, i++, "payments-new");
  await page.goto(`${baseUrl}/admin/inventory`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle");
  await snap(page, i++, "inventory");
  await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await snap(page, i++, "admin-home");

  console.log(`captured ${i - 1} screenshots`);
} finally {
  await browser.close();
}
