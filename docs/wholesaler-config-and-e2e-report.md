# Wholesaler configurability + E2E report

**Branch:** `feature/v1-3.4-close-show-workflow-polish`  
**Date:** 2025-03-03

---

## PROJECT HEAD SNAPSHOT

- **Branch:** `feature/v1-3.4-close-show-workflow-polish`
- **Status:** Modified + untracked (layout, shows, balances, dashboard, wholesalers, payments, inventory, \_components; backend routes/tests; docs). New: seed script, Makefile dev-seed.
- **Changed this session:** `backend/scripts/seed-dev.ts`, `backend/package.json`, `Makefile`, `frontend/app/(admin)/admin/shows/page.tsx`, `frontend/app/(admin)/admin/shows/[id]/ShowDetailView.tsx` (Unicode apostrophe fix + wrapper div).

---

## STEP A — AUDIT FOR SPECIAL-CASING

**Result: PASS**

- Searched frontend + backend for: `"Carlos"`, `"Chad"`, `"Jared"`, `"ASAP"`, `"two weeks"`, logic keyed on wholesaler name/id.
- **Findings:** None. Only normal lookups: `balances.find((r) => r.wholesaler_id === id)` (batch-pay) and test code finding balance by `wholesaler_id`. No hardcoded names or special-case behavior.
- **Conclusion:** Wholesaler behavior is configurable via fields only; no refactor needed.

---

## STEP B — WHOLESALER CONFIG FIELDS (DOC + CHECK)

**Configurable fields today**

| Field         | Create (POST /wholesalers) | Update (PATCH /wholesalers/:id) | Notes                                   |
| ------------- | -------------------------- | ------------------------------- | --------------------------------------- |
| name          | Required                   | —                               | Trimmed, non-empty                      |
| contact_email | Optional                   | —                               |                                         |
| contact_phone | Optional                   | —                               |                                         |
| notes         | Optional                   | —                               |                                         |
| pay_schedule  | Set by DB default (AD_HOC) | Yes                             | Enum: AD_HOC, WEEKLY, BIWEEKLY, MONTHLY |

**Pay cadence**

- Stored as `pay_schedule` on `wholesalers`. Used only for:
  - Labels (e.g. “BIWEEKLY” in dashboard / batch-pay).
  - “Last paid” freshness dot (within / 2× / overdue vs window).
  - Batch-pay default date window (7 / 14 / 30 days).
- No automated enforcement: no auto-due dates, no blocking, no reminders. Purely metadata + UX.

**Create/edit surface**

- Backend: POST creates (name + optional contact/notes); PATCH updates `pay_schedule` only. No dedicated “edit wholesaler” form in frontend; pay cadence is edited on Wholesaler detail (PATCH). Wholesalers are created via API (e.g. seed or future admin form).

---

## STEP C — SEED DEV DATA FOR E2E

**Result: DONE**

- **Mechanism:** Script `backend/scripts/seed-dev.ts`, run with `make dev-seed` or `DATABASE_URL=... npm --prefix backend run seed:dev`.
- **Requires:** DB up (e.g. `make dev-db-up`), migrations run (`make dev-migrate`). Uses one seed user (cognito_user_id `seed-dev-user`) for `created_by`.
- **Seeded data:**
  - 3 wholesalers: “Seed Wholesaler A (ASAP)” (AD_HOC), “Seed Wholesaler B (batch)” (BIWEEKLY), “Seed Mom Inventory” (AD_HOC).
  - 2 shows: “Seed Show Active” (ACTIVE, payout 1000, 2 settlements: W1 20%, W2 fixed 100); “Seed Show Closed” (COMPLETED, payout 500, 1 settlement W3 150).
  - 2 payments: W1 partial 50 (Partially paid); W2 full 100 (Paid). W3 no payment (Unpaid, last_payment_date null).
- **Balances:** Paid (W2), Partially paid (W1), Unpaid (W3). last_payment_date set for W1 and W2, null for W3.

**Run locally:** `make dev-db-up && make dev-migrate && make dev-seed`. (Seed was not run in this environment: no Docker/Postgres; script exits with ECONNREFUSED.)

---

## STEP D — E2E QA CHECKLIST (manual)

Execute with dev backend + frontend and seeded data (after `make dev-seed`).

1. **/admin/shows**
   - [ ] At least one ACTIVE row shows “Close out” in Action.
   - [ ] COMPLETED rows show “View” in Action.

2. **/admin/shows/[id]** (ACTIVE show)
   - [ ] Payout After Fees is editable (Edit → Save).
   - [ ] Settlements: add settlement (percent + fixed), delete allowed.
   - [ ] Summary & review shows profit estimate.
   - [ ] “Close out show” section: click “Close out show” → confirm → inputs lock.

3. **/admin/shows/[id]** (COMPLETED show)
   - [ ] Locked note: “This show is closed. Payout and settlements are locked…”
   - [ ] Payout and Settlements show “Locked — reopen…”
   - [ ] “Reopen show (unlocks payout and settlements)” works; after reopen, payout/settlements editable again.

4. **/admin/payments/new**
   - [ ] Record a payment for a wholesaler (e.g. W3).
   - [ ] /admin/balances: that wholesaler’s status chip updates (e.g. Unpaid → Partially paid).
   - [ ] Dashboard “Who you still owe”: row and “Last payment: Today” (or “X days ago”) update.

5. **Wholesaler detail**
   - [ ] /admin/wholesalers/[id]: “Last payment: X days ago” (or “—”) under name.
   - [ ] Statement section loads.

**Execution note:** E2E was not run in this environment (no local Postgres/Docker). Backend unit tests: 3 suites failed (pre-existing; attachment/auth/validation). Frontend build: **PASS** (after fixing Unicode apostrophe in ShowDetailView).

---

## STEP E — SHOWS LIST “—” COLUMNS FINISH

**Result: DONE (option A — remove columns)**

- **Choice:** Remove “Payout After Fees”, “# of Settlements”, “Profit Estimate” from the shows list. List API does not return aggregates; adding them would require backend changes and N+1 or new endpoint.
- **Change:** In `frontend/app/(admin)/admin/shows/page.tsx`, removed the three columns and their “—” cells. Table now: Show Name, Date, Status, Action. colSpan set to 4 for loading/empty states.

---

## FILES CHANGED (SUMMARY)

| File                                                       | Change                                                                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `backend/scripts/seed-dev.ts`                              | New: seed user, 3 wholesalers, 2 shows (financials + settlements), 2 payments.                                   |
| `backend/package.json`                                     | Added script `seed:dev` → `tsx scripts/seed-dev.ts`.                                                             |
| `Makefile`                                                 | Added `dev-seed` target; help text for dev-seed.                                                                 |
| `frontend/app/(admin)/admin/shows/page.tsx`                | Removed Payout / # Settlements / Profit columns; colSpan 4.                                                      |
| `frontend/app/(admin)/admin/shows/[id]/ShowDetailView.tsx` | Replaced Unicode apostrophe (can’t → can't) to fix build; wrapped Close section branch in `<div>` for valid JSX. |
| `docs/wholesaler-config-and-e2e-report.md`                 | New: this report.                                                                                                |

---

## OPTIONAL (P1) FOLLOW-UPS

- **Wholesaler create form (admin):** Add a simple “New wholesaler” form in the admin (name, optional contact/notes) that calls POST /wholesalers so Felicia can create wholesalers without API/seed.
- **Shows list aggregates (backend):** If product wants payout/settlements/profit on the list later, add GET /shows with optional summary fields or a lightweight aggregate query and repopulate the columns.
- **Seed idempotency:** Optionally make seed script idempotent (e.g. delete by name pattern or use “seed” flag) so `make dev-seed` can be run multiple times without duplicates.
- **E2E automation:** Add Playwright or similar to run the Step D checklist in CI when DB is available.
