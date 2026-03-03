# Admin UX Audit & Close-Out Show Flow Proposal

**Branch:** `feature/v1-3.4-close-show-workflow-polish`  
**Date:** 2025-03-03

---

## 1) PROJECT HEAD SNAPSHOT

### Current git branch

```
feature/v1-3.4-close-show-workflow-polish
```

### Git status (summary)

- **Modified:** 22 files across backend (tests, index, read-models, routes) and frontend (admin pages, API clients).
- **Untracked:** 2 migrations (`wholesalers_pay_schedule`, `inventory_purchases`), 2 backend tests (`closed-show-freeze`, `inventory-purchases-integration`), read-model `unpaid-closed-shows`, route `inventory-purchases`, frontend `AdminHeaderUser`, `inventory/` and `wholesalers/[id]/batch-pay/` pages, API `inventory-purchases`.

### Last 5 commits

```
7b0fa18 feat(portal): implement CSV export for wholesaler statements
663cd69 Merge pull request #11 from wesleyhooker:feature/v1-5.1-auth-shell-foundation
66c552c test: add closePool mock to database tests
b6bdb6c fix(portal): streamline error handling for portal access
9c48b76 mismatches during development. - Adjusted ALB security group...
```

### Admin routes (tree)

```
frontend/app/(admin)/admin/
├── AdminHeaderUser.tsx
├── layout.tsx              # Left nav: Home, Shows, Wholesalers, Balances, Payments
├── page.tsx                # redirects to /admin/dashboard
├── dashboard/page.tsx      # Dashboard (quick actions, totals, who you owe, recent shows/payments)
├── balances/
│   ├── BalancesTable.tsx   # Table + search, owing only, sort, Download CSV
│   ├── loading.tsx
│   └── page.tsx
├── inventory/
│   └── page.tsx            # Inventory purchases (add + list last 30 days)
├── payments/
│   ├── PaymentsListView.tsx
│   ├── new/page.tsx        # Record payment form
│   └── page.tsx
├── shows/
│   ├── page.tsx            # Shows list (name, date, status; payout/settlements/profit columns show "—")
│   ├── new/page.tsx       # Create Show (name, platform, date, payout after fees)
│   └── [id]/
│       ├── page.tsx
│       └── ShowDetailView.tsx   # Payout, settlements, Close/Reopen
├── wholesalers/
│   ├── page.tsx            # Wholesalers list (name, balance, total paid, Record payment)
│   └── [id]/
│       ├── page.tsx
│       ├── WholesalerDetailView.tsx   # Pay cadence, Statement table
│       └── batch-pay/page.tsx          # Balance breakdown (closed shows + date filter, Record payment)
```

**Note:** `Inventory` is **not** in the left nav; it’s only linked from the Dashboard “Quick actions.”

---

## 2) AS-IS IA MAP (Current Admin UX)

### Left nav (layout)

| Item        | Target                        | Notes                              |
| ----------- | ----------------------------- | ---------------------------------- |
| Home        | `/admin` → `/admin/dashboard` | Single “Admin” section, flat list. |
| Shows       | `/admin/shows`                |                                    |
| Wholesalers | `/admin/wholesalers`          |                                    |
| Balances    | `/admin/balances`             |                                    |
| Payments    | `/admin/payments`             |                                    |

No nav item for **Inventory** or **Dashboard** (Dashboard is reached via Home).

### Routes and what they do

| Route                               | Purpose                                                                                                                                                                                                                                                                                                    | Primary objects                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `/admin`                            | Redirect to dashboard                                                                                                                                                                                                                                                                                      | —                                              |
| `/admin/dashboard`                  | Summary: Total Owed/Paid/Outstanding, Cash Snapshot, “Who you still owe” table (with last-paid dot, pay schedule, “View balance breakdown” / “Record payment”), Recent Shows, Recent Payments. Quick actions: New Show, Wholesalers, Record payment, Inventory.                                            | Show, Wholesaler, Payment, Balance             |
| `/admin/shows`                      | List shows: name, date, (payout/settlements/profit columns show “—”), status (Open/Closed). CTA: + Create Show.                                                                                                                                                                                            | Show                                           |
| `/admin/shows/new`                  | Create show: name, platform, date, **Payout After Fees** (optional at create). Submit → redirect to shows list.                                                                                                                                                                                            | Show, Financials                               |
| `/admin/shows/[id]`                 | Show detail: header (name, date), Close/Reopen; summary cards (Payout, Total Owed, Total Paid, Balance Remaining, Status); **Payout After Fees** (editable); **Settlements** table (wholesaler, percent/fixed, owed/paid/balance, delete); **Add Settlement** (wholesaler, Percent vs Fixed, rate/amount). | Show, Financials, Settlement (owed_line_items) |
| `/admin/wholesalers`                | List wholesalers: name, balance owed, total paid; link to Record payment. Search.                                                                                                                                                                                                                          | Wholesaler, Balance                            |
| `/admin/wholesalers/[id]`           | Wholesaler detail: current balance, **Pay cadence** (Ad hoc / Weekly / Biweekly / Monthly), **Statement** (date, type Settlement/Payment, show, amount owed/paid, running balance). CTA: Record payment.                                                                                                   | Wholesaler, Statement (ledger)                 |
| `/admin/wholesalers/[id]/batch-pay` | “Balance breakdown — {name}”: date range filter (All / 7 / 14 / 30 days), total for displayed shows, table of closed shows (show, date, owed). CTA: Record payment.                                                                                                                                        | Wholesaler, Unpaid closed shows                |
| `/admin/balances`                   | Summary cards (Total Outstanding, Total Owed, Total Paid, Wholesalers Owing). **BalancesTable:** search, “Owing only,” sort, **Download CSV**.                                                                                                                                                             | Balance (per wholesaler)                       |
| `/admin/payments`                   | List payments: date, wholesaler, amount, method, reference. CTA: Record payment.                                                                                                                                                                                                                           | Payment                                        |
| `/admin/payments/new`               | Record payment: date, wholesaler, amount, method, reference. Optional `?wholesalerId=` prefills. Submit → redirect to wholesaler detail.                                                                                                                                                                   | Payment                                        |
| `/admin/inventory`                  | Add purchase (date, amount, notes). Table: recent purchases (last 30 days). No nav link; Dashboard only.                                                                                                                                                                                                   | Inventory purchase                             |

### Primary objects (AS-IS)

- **Show:** Created with name, platform, date; optional payout at create. Status `ACTIVE` | `COMPLETED` (Closed). Backend freezes financials/settlements when `COMPLETED`.
- **Wholesaler:** Created via API; list from balances. Pay schedule (AD_HOC, WEEKLY, BIWEEKLY, MONTHLY) on detail.
- **Settlement:** Per-show, per-wholesaler. Methods: **PERCENT_PAYOUT** (rate_bps) or **MANUAL** (fixed amount). Stored as `owed_line_items`; balances/statement derived from these + payments.
- **Payment:** Date, wholesaler, amount, method, reference; applied to reduce balance (no show-level allocation in UI).
- **Statement/Balances:** Wholesaler-level. Balances = owed_total, paid_total, balance_owed, last_payment_date (and pay_schedule). Statement = ledger (settlements + payments, running balance). “Batch pay” = closed shows contributing to balance for a wholesaler.
- **Export:** Balances CSV from `/admin/balances` (exports/balances.csv). Portal has statement CSV for linked wholesaler.

### Duplicates / confusing naming

- **“Balances” vs “Who you still owe”:** Same underlying data (wholesaler balances). Dashboard shows “Who you still owe” with actions; Balances page is full table + export. Two entry points, no single “source of truth” label.
- **“Statement” (wholesaler detail) vs “Balance breakdown” (batch-pay):** Statement = full ledger; batch-pay = closed shows in balance. Both support “who do I pay and for what?” but different slices.
- **“Settlement” in UI vs “owed line item” in backend:** Same thing; “Settlement” is user-facing.
- **Shows list columns:** “Payout After Fees,” “# of Settlements,” “Profit Estimate” exist in UI but show “—”; list API doesn’t aggregate financials, so those columns are placeholders.
- **Create Show vs Close out:** Create Show asks for payout up front; “close out” is really: open show detail → add/edit payout → add settlements → Close Show. No single “Close out show” entry point; it’s buried in show detail.
- **Inventory:** Not in nav; easy to miss.

---

## 3) GAP ANALYSIS VS FELICIA WORKFLOW

### Felicia’s steps → Where they happen today

| Felicia step                                                               | Where it happens today                                                                                                                                                                                                                                                               | Gap / note                                                                                                                                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1) Whatnot: create shipping labels                                         | Outside system                                                                                                                                                                                                                                                                       | N/A.                                                                                                                                                                                                                  |
| 2) Count sold items by category + math (qty × unit cost) → wholesaler owed | **Partially:** She does math externally. In admin she enters **result** as either (a) **Fixed** settlement (MANUAL amount) or (b) **Percent** of payout (PERCENT_PAYOUT). No in-app **category counting** or **qty × unit cost** calculator.                                         | **Missing:** Category-level entry (e.g. “Jewelry 10 @ $2”), calculator that sums to owed. Today she must do math elsewhere and enter one number per wholesaler (or percent).                                          |
| 3) Log into admin, enter items/prices/wholesaler/owed                      | **Show detail:** Create or open show → Payout After Fees → Add Settlement (wholesaler + Percent or Fixed). No “items” or line-level breakdown in UI (backend has single amount/percent per settlement).                                                                              | **Jumbled:** Flow is “create show (maybe with payout) → open show → edit payout → add settlements.” No clear “Close out” wizard. Deal type (unit-cost vs % of payout) exists but is not framed as “deal type” choice. |
| 4) Payments: Carlos ASAP, Chad/Jared batch ~2 weeks, pay self last         | **Payments:** Record payment from Dashboard “Who you owe,” Wholesaler detail, Batch-pay, or Payments list. **Pay cadence** (Ad hoc / Weekly / Biweekly / Monthly) exists on wholesaler; dashboard “last paid” dot (green/amber/red) and “View balance breakdown” support batch view. | **Partial:** No explicit “Needs payment this week” or “ASAP” flag. Cadence is per wholesaler; “pay self last” is mental, not modeled.                                                                                 |
| 5) Mom as wholesaler; accurate owed tracking                               | **Supported:** Mom can be a wholesaler; settlements and payments same as others.                                                                                                                                                                                                     | OK.                                                                                                                                                                                                                   |
| 6) Deal types: per-item/unit-cost vs % of payout-after-fees                | **Supported in data:** MANUAL (fixed) and PERCENT_PAYOUT. UI: “Percent” vs “Fixed” in Add Settlement.                                                                                                                                                                                | **Naming:** “Unit cost” is not spelled out; Felicia may not map “Fixed” to “I calculated qty × cost elsewhere.”                                                                                                       |
| 7) Safety: Excel color-coding paid/unpaid by week                          | **Partially:** Dashboard “Who you still owe” (outstanding only), last-paid dot by schedule, amber row for outstanding. Balances page: “Owing only” filter, CSV export.                                                                                                               | **Gap:** No explicit “Unpaid / Partially paid / Paid” **status chips** per wholesaler or per show, no “last paid week” or “needs payment this week” filter.                                                           |

### What’s missing (summary)

- **Category counting + calculator:** No entry of “category × qty × unit cost”;
- **Guided “Close out show” flow:** No single path: Enter payout → Add settlements (with clear deal type) → Review totals → Mark closed;
- **Explicit “show closed” moment** in IA: Close exists (status COMPLETED) but is one action among many on show detail, not the climax of a wizard;
- **Batch payment tracking:** Batch-pay page shows “what’s in the balance”; no “mark these as paid in a batch” or “paid week” tag;
- **Safety at a glance:** No status chips (Unpaid / Partially paid / Paid), no “last paid week” or “needs payment this week” filter.

### What feels out of order / jumbled

- **Show creation** asks for payout immediately; many users may not have it until after the show. “Create show” and “close out show” are conflated.
- **Settlements** live only inside show detail; no way to “start closing out” from a list of open shows with one click.
- **Balances** and **Dashboard “Who you owe”** overlap; **Payments** and **Record payment** are separate from “batch pay” (which is under Wholesaler).
- **Inventory** is not in nav; **Export** is only on Balances (and portal for wholesaler statement).

---

## 4) TO-BE IA + CLOSE-OUT FLOW

### A) Cleaned SaaS nav grouping (proposal)

Keep routes stable where possible; group in nav and relabel for clarity.

**Suggested nav structure:**

```
Admin
├── Home          → /admin (dashboard)
├── Shows         → /admin/shows
│   (sub or context: “Log” = list + new; “Close out” = flow from open show)
├── Wholesalers   → /admin/wholesalers
│   (directory + per-wholesaler Statements; Batch pay from detail or dashboard)
├── Payments      → /admin/payments
│   (Record payment = /admin/payments/new; list = /admin/payments)
├── Balances      → /admin/balances
│   (Outstanding by wholesaler + Export)
├── Inventory     → /admin/inventory
│   (Add to nav; optional section “Reports” later with Export)
```

**Section labels (optional visual grouping in nav):**

- **Shows** — “Shows (Log & close out)”
- **Wholesalers** — “Wholesalers (Directory & statements)”
- **Payments** — “Payments (Record & history)”
- **Balances** — “Balances (Who you owe & export)”
- **Inventory** — “Inventory”

No backend or URL changes required for this; only nav labels and adding Inventory to the sidebar.

### B) Guided “Close out show” flow

**Screen names and route suggestions:**

| Step       | Screen / route                               | What happens                                                                                                                                                                                                                                                                                                                |
| ---------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Step 0** | Show exists (created with or without payout) | Either from **Shows** list (e.g. “Close out” on open show) or direct link to show detail.                                                                                                                                                                                                                                   |
| **Step 1** | **Show detail** — “Payout After Fees”        | Enter or edit payout after fees (from Whatnot). Optional: “I’ll add this later” (payout 0 or empty until filled). Route: existing `/admin/shows/[id]`.                                                                                                                                                                      |
| **Step 2** | **Show detail** — “Settlements”              | Add settlements: choose wholesaler, then **deal type**: “Unit cost (fixed amount)” or “Percent of payout after fees.” Enter amount or %. Repeat for each wholesaler. Route: same `/admin/shows/[id]` (Add Settlement form).                                                                                                 |
| **Step 3** | **Show detail** — “Review”                   | Same page: summary cards show **Total Owed**, **Balance Remaining**, **Profit estimate** (payout − total owed). Explicit line: “Owed per wholesaler” in table. No new route.                                                                                                                                                |
| **Step 4** | **Show detail** — “Close show”               | Button “Close show” with short confirmation: “Payout and settlements will be locked. You can still record payments against this show’s balances.” On confirm → PATCH status to COMPLETED. **Closed** in data = `show.status === 'COMPLETED'`; in UI = status chip “Closed” and copy “Reopen to edit payout or settlements.” |
| **Step 5** | (Phase 2) Notes/attachments                  | Later: add notes or attachments to show (backend already has attachment routes).                                                                                                                                                                                                                                            |

**“Closed” definition:**

- **Data:** `shows.status = 'COMPLETED'`. Backend already blocks edits to financials and settlements when COMPLETED; reopening (ACTIVE) allows edits again.
- **UI:** Status chip “Closed”; message that payout/settlements are locked; payments still recordable (they apply to wholesaler balance, which aggregates from closed shows).

**Minimal UI changes for the flow (no new routes):**

- On **Show detail**, order sections clearly: (1) Payout After Fees, (2) Settlements (list + add), (3) Summary/Review (totals + profit estimate), (4) Close Show.
- Optional: “Close out” link/button on **Shows list** for open shows → goes to show detail (same route).
- Optional: Add Settlement labels: “Unit cost (fixed amount)” and “Percent of payout” to match Felicia’s language.

### C) “Safety at a glance” widgets (replace Excel color-coding)

- **Status chips (per wholesaler):** In “Who you still owe” / Balances table, add a chip: **Unpaid** (balance > 0, never paid or overdue), **Partially paid** (balance > 0, some payments), **Paid** (balance ≤ 0). Use existing `balance_owed` and `last_payment_date` (and optional pay_schedule) to derive.
- **“Last paid week” indicator:** Already have `last_payment_date`; show it as “Last paid: &lt;date&gt;” or “Week of &lt;week start&gt;” in dashboard table and optionally on Balances.
- **Filter: “Needs payment this week”:** On Dashboard or Balances, filter to wholesalers with (a) balance > 0 and (b) pay_schedule = WEEKLY/BIWEEKLY/MONTHLY and (c) last payment outside the current window (or never). Simple implementation: use existing pay_schedule + last_payment_date; “needs payment” = red dot or explicit tag.

Keep it simple: no heavy analytics, just chips + one filter + existing “last paid” dot.

---

## 5) IMPLEMENTATION PUNCH LIST

### P0 (must) — Minimal UI for coherent flow

| #   | Task                                                                                                                                                                | Files / components                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | Add **Inventory** to left nav in admin layout                                                                                                                       | `frontend/app/(admin)/admin/layout.tsx`                                                                             |
| 2   | Order Show detail sections into clear flow: Payout → Settlements → Summary → Close Show; optional short “Close out” copy                                            | `frontend/app/(admin)/admin/shows/[id]/ShowDetailView.tsx`                                                          |
| 3   | Add “Close out” action on **Shows list** for open shows (link to show detail)                                                                                       | `frontend/app/(admin)/admin/shows/page.tsx`                                                                         |
| 4   | In Add Settlement, label options: “Unit cost (fixed amount)” and “Percent of payout after fees”                                                                     | `frontend/app/(admin)/admin/shows/[id]/ShowDetailView.tsx` (AddSettlementForm)                                      |
| 5   | Add **status chips** (Unpaid / Partially paid / Paid) to Dashboard “Who you still owe” table and/or Balances table (derive from balance_owed and last_payment_date) | `frontend/app/(admin)/admin/dashboard/page.tsx`, optionally `frontend/app/(admin)/admin/balances/BalancesTable.tsx` |
| 6   | Ensure “Closed” meaning is visible on Show detail (chip + one line: “Reopen to edit payout or settlements”)                                                         | Already partially there; tighten copy in `ShowDetailView.tsx`                                                       |

### P1 (nice-to-have)

| #   | Task                                                                                                                                                                          | Files / components                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 7   | Optional nav group labels (e.g. “Shows (Log & close out)”)                                                                                                                    | `frontend/app/(admin)/admin/layout.tsx`                                                                                             |
| 8   | “Needs payment this week” filter on Dashboard or Balances (balance > 0 + schedule window overdue)                                                                             | `frontend/app/(admin)/admin/dashboard/page.tsx` or `balances/page.tsx` + table                                                      |
| 9   | “Last paid week” text (e.g. “Week of 2025-02-24”) next to last_payment_date where space allows                                                                                | Dashboard “Who you still owe”, `WholesalerDetailView` or batch-pay                                                                  |
| 10  | Shows list: populate Payout After Fees, # Settlements, Profit Estimate (requires backend list endpoint to return aggregates or N+1; if too heavy, keep “—” or remove columns) | Backend: optional `GET /shows` with financial summary; `frontend/app/(admin)/admin/shows/page.tsx`, `frontend/src/lib/api/shows.ts` |

### Out of scope (no change)

- Backend API contracts (no breaking changes).
- Category-level entry or qty × unit cost calculator (larger feature).
- “Pay self last” or batch “mark as paid” (behavior stays as today: record payment per wholesaler).

---

**Summary:** The AS-IS admin already supports Felicia’s workflow in data (shows, settlements, payments, balances, pay cadence, closed-show freeze). Gaps are **discoverability** (Inventory, single “close out” path), **wording** (deal types, “Closed”), and **safety at a glance** (status chips, “needs payment this week”). The punch list focuses on P0 nav + Show detail flow + status chips, with P1 for filters and list enrichment.
