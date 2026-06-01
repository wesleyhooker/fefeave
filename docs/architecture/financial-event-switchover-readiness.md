# Financial Event Switchover — Completion Report

**Branch:** `feat/financials-event-source-completion`  
**Date:** 2026-05-30  
**Scope:** Complete practical event-driven Financials for first user delivery.

## Summary

Financials is now **practical event-driven**: `financial_events` is the authoritative
source for financial movement history, recommendation cash math, Activity, Overview
summary totals, wholesaler/account balance totals, show profit, and owner weekly payout
preview. Domain tables remain as operational read models for CRUD, forms, and statement
drilldowns — not as competing sources for financial calculations.

| Area                                                                   | Status                                                   |
| ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Activity timeline                                                      | **Event-backed** (`financial_events` only)               |
| Recommendation cash math                                               | **Event-backed** (default; emergency table rollback)     |
| Business expense summary (`/admin/business-expenses-total`)            | **Event-backed**                                         |
| Inventory invested summary (`/admin/inventory-invested`)               | **Event-backed**                                         |
| Wholesaler balances (`/wholesalers/balances`, `/exports/balances.csv`) | **Event-backed** (Phase 7b)                              |
| Account financial totals (`GET /accounts`)                             | **Event-backed** (Phase 7b)                              |
| Show profit (per-show / window API)                                    | **Event-backed** (Phase 7c)                              |
| Owner weekly payout preview (`GET/PUT /owner-self-pay`)                | **Event-backed** (Phase 7d)                              |
| Owner activity `closedProfitTotal`                                     | **Event-backed** (Phase 7d)                              |
| Wholesaler statements / drilldowns                                     | **Event-backed** (Phase 7e)                              |
| Unpaid closed show owed drilldown                                      | **Event-backed** (Phase 7e)                              |
| Ledger CSV export                                                      | **Event-backed** (Phase 7e)                              |
| Expense/inventory/payment CRUD lists                                   | **Operational read models** (domain tables)              |
| Settlement/show detail forms                                           | **Operational read models**                              |
| Cash snapshot anchor                                                   | **Operational read model** (`cash_snapshots`)            |
| Dashboard / shows list profit UI                                       | **Event-backed** (Phase 7c API)                          |
| Show detail profit (closed)                                            | **Event-backed** (`GET /shows/:showId/financial-profit`) |
| Owner activity total paid                                              | **Event-backed** (`GET /owner-self-pay/activity`)        |

## Architecture classification

**Practical event-driven Financials** — not half-hybrid, not pure event-sourced.

- The event ledger is authoritative for **financial facts, history, and calculations**.
- Relational domain tables are **operational records, form read models, or projections**.
- Full deletion of domain tables is **not required** and **not the goal**.

## Event-backed summary service

`backend/src/services/financial-event-summaries.ts` calculates from `financial_events`:

- Business expense totals (OUTFLOW, `BUSINESS_EXPENSE_RECORDED`)
- Inventory spend totals (OUTFLOW, `INVENTORY_PURCHASE_RECORDED`)
- Owner outflows (latest per source, void excluded)
- Completed-show payout inflows (latest per show, `show_status = COMPLETED`)
- Owner activity **`totalPaidAmount`** via `loadOwnerTotalPaidAmount`

## Event-backed obligation projections (Phase 7b)

`backend/src/services/financial-obligation-projections.ts` calculates from `financial_events`:

- Wholesaler **`owed_total`** — latest non-void `SETTLEMENT_*` per `owed_line_item` source
- Wholesaler **`paid_total`** — sum of `WHOLESALER_PAYMENT_RECORDED`
- **`balance_owed`** — owed minus paid
- **`last_payment_date`** — max payment event effective date
- Account list totals and owner **`selfPayTotal`** (owner account only, from owner events)

## Event-backed show profit (Phase 7c–7d)

`backend/src/services/financial-show-profit.ts` + `owner-weekly-payout.ts`:

- Per-show profit and completed-show window totals from payout + settlement events
- **`computeOwnerWeeklyPayout`** for payout preview and PUT validation
- Activity **`closedProfitTotal`** from event window; show list metadata from `shows`

## Event-backed statements and drilldowns (Phase 7e)

`backend/src/services/financial-statement-projections.ts`:

- **`getWholesalerStatement`** — owed/payment amounts and running balance from events;
  show names, calculation method, and itemized lines from operational tables
- **`readUnpaidClosedShowsForWholesaler`** — SHOW_LINKED owed totals by completed show
  from events; show metadata from `shows`
- **`readLedgerEntries`** — ledger CSV owed/payment lines from events
- Admin statement, portal statement/CSV, and `GET /exports/wholesaler-statement.csv`
  reuse the same projection path

## Frontend profit adoption (Phase 7c UI)

- **`showFinancialSummary.ts`** — adapter over event profit APIs (replaces client
  `fetchShowFinancials` + `fetchShowSettlements` rollups for list/dashboard)
- **Dashboard** — week/YTD profit via `GET /shows/completed-profit`; month chart and
  week strip via batch `GET /shows/financial-profits`
- **Shows list / week strip** — batch `financial-profits` for row profit columns
- **Show detail (closed)** — `GET /shows/:showId/financial-profit` for displayed profit;
  open-show close-out still uses operational form preview (`computeTotals`)
- **`lib/showProfit.ts`** — display helpers for settlement form previews only

## Recommendation cash (unchanged default, clarified rollback)

**Default:** `FINANCIAL_RECOMMENDATIONS_SOURCE=events`

- Post-snapshot cash via `loadCashEventTotalsFromEvents`.
- Snapshot anchor still from `cash_snapshots` (operational anchor, not event replay).

**Emergency rollback only:** `FINANCIAL_RECOMMENDATIONS_SOURCE=tables`

- Uses legacy `loadCashEventTotals` (table-derived path).
- For incident response and parity tests — **not** a competing source of truth.

## Remaining table-backed reads (by design)

| Read path                                          | Why table-backed                                  |
| -------------------------------------------------- | ------------------------------------------------- |
| Expense/inventory/payment lists                    | Source-specific fields for data entry and editing |
| Settlement/show detail forms, itemized line labels | Operational drilldown metadata                    |
| Show detail financials form                        | Payout entry CRUD                                 |
| Show detail settlement form previews               | Live close-out editing                            |
| Latest cash snapshot                               | Reconciliation anchor input                       |

## Remaining known gaps

| Gap                                          | Impact                                  | Mitigation                          |
| -------------------------------------------- | --------------------------------------- | ----------------------------------- |
| Legacy `SHOW_PAYOUT_*` without `show_status` | Under-count completed-show profit       | Targeted repair; backfill           |
| Pre-backfill historical rows                 | Event totals under-count until backfill | `npm run backfill:financial-events` |

## Phase 7e — Statements and drilldowns (complete)

Wholesaler statement running balances, statement CSV exports, ledger CSV, and unpaid
closed show owed drilldowns derive financial amounts from `financial_events`. Domain
tables remain for CRUD, forms, and non-financial metadata (show names, itemized lines).

**Financials event-driven program complete.** Backend projections and frontend profit
displays now use `financial_events` via Phase 7c APIs. Domain tables remain for CRUD,
forms, and operational metadata only.

## Validation

```bash
cd backend && npm run build
cd backend && npm test
cd backend && npm run test:integration
cd frontend && npm run lint
cd frontend && npm run build
cd frontend && npm test
```

## Files touched

### Phase 7a — Obligation event gaps (vendor expenses)

- `backend/src/services/financial-event-emission.ts`
- `backend/src/routes/vendor-expenses.ts`
- `backend/src/services/financial-events-backfill.ts`
- `backend/src/__tests__/financial-events-dual-write-integration.test.ts`
- `backend/src/__tests__/financial-events-backfill-integration.test.ts`

### Phase 7b — Event-derived obligation projections

- `backend/src/services/financial-obligation-projections.ts`
- `backend/src/read-models/balances.ts`
- `backend/src/routes/accounts.ts`
- `backend/src/services/balancesView.ts`
- `backend/src/__tests__/financial-obligation-projections.test.ts`
- `backend/src/__tests__/financial-obligation-projections-integration.test.ts`

### Phase 7c — Event-derived show profit

- `backend/src/services/financial-show-profit.ts`
- `backend/src/routes/show-financials.ts`
- `backend/src/__tests__/financial-show-profit.test.ts`
- `backend/src/__tests__/financial-show-profit-integration.test.ts`

### Phase 7d — Owner weekly payout and activity profit

- `backend/src/services/owner-weekly-payout.ts`
- `backend/src/routes/owner-self-pay.ts`
- `backend/src/__tests__/owner-weekly-payout-integration.test.ts`
- `backend/src/__tests__/owner-self-pay-activity-integration.test.ts`

### Phase 7e — Statements and drilldowns

- `backend/src/services/financial-statement-projections.ts`
- `backend/src/services/wholesaler-statement.ts`
- `backend/src/read-models/unpaid-closed-shows.ts`
- `backend/src/read-models/ledger-entries.ts`
- `backend/src/__tests__/financial-statement-projections-integration.test.ts`

### Phase 6 / overview summaries (promoted in this branch)

- `backend/src/services/financial-event-summaries.ts`
- `backend/src/routes/business-expenses.ts`
- `backend/src/routes/inventory-purchases.ts`
- `backend/src/__tests__/financial-event-summaries.test.ts`
- `backend/src/__tests__/financial-event-summaries-integration.test.ts`
- `backend/src/__tests__/business-expenses-integration.test.ts`
- `backend/src/__tests__/inventory-purchases-integration.test.ts`

### Shared / config

- `backend/src/config/env.ts`
- `backend/src/services/recommendation-cash-totals.ts`
- `backend/package.json`
- `backend/scripts/run-integration-tests.sh`

### Frontend profit adoption (Phase 7c UI)

- `frontend/src/lib/api/shows.ts`
- `frontend/app/(admin)/admin/_lib/showFinancialSummary.ts`
- `frontend/app/(admin)/admin/dashboard/page.tsx`
- `frontend/app/(admin)/admin/shows/[id]/ShowDetailView.tsx`
- `frontend/app/(admin)/admin/shows/_components/WeekDesktopTable.tsx`
- `frontend/lib/showProfit.ts`
- `frontend/app/(admin)/admin/_lib/showFinancialSummary.test.ts`
- `frontend/package.json`

### Docs

- `docs/architecture/financial-event-sourcing.md`
- `docs/architecture/financial-event-switchover-readiness.md` (this report)
- `docs/product/financial-decision-center-plan.md`
