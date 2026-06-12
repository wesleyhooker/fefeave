# Dev E2E runbook (“Felicia day” workflow)

Use this to run a full dev end-to-end pass with seeded data. **Dev only** — no prod seeding or prod code paths.

Event-backed Financials (recommendations, Activity, balances, show profit, owner payout) reads from **`financial_events`**. `make dev-seed` writes operational domain rows, then runs the same backfill CLI used in prod/staging so local pages show realistic numbers.

---

## 1. Commands to run

From repo root:

```bash
# Start Postgres (if not already running)
make dev-db-up

# Run migrations
make dev-migrate

# Seed dev data + financial_events backfill (idempotent — safe to run repeatedly)
make dev-seed

# Verify mock Financials metrics
make dev-seed-verify

# Optional: clean schema reset + migrate + seed
make dev-reset

# Start backend + frontend (pick one)
make dev-api          # Terminal A: backend on :3000 (dev_bypass auth)
make dev-ui           # Terminal B: frontend on :3001
# Or use make dev-tmux to run both in split panes
```

Then open: **http://localhost:3001/admin**

For automated screenshots / bootstrap auth, see [DEV.md](DEV.md).

---

## 2. Expected seeded entity names (for fast testing)

| Type        | Names                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------- |
| Wholesalers | `Seed Wholesaler A (ASAP)`, `Seed Wholesaler B (batch)`, `Seed Mom Inventory`             |
| Shows       | `Seed Show This Week Active`, `Seed Show This Week Closed`, `Seed Show Next Week Planned` |

### Domain snapshot (after `make dev-seed`)

| Area                  | What you get                                                                       |
| --------------------- | ---------------------------------------------------------------------------------- |
| **ACTIVE show**       | Payout $1,200 (gross $1,600 − fee $400); 2 settlements ($240 + $120)               |
| **COMPLETED show**    | Payout $1,500 (gross $2,200 − fee $700); 1 settlement ($300) → **profit $1,200**   |
| **PLANNED show**      | Upcoming show, no financials yet                                                   |
| **Vendor expense**    | $85 obligation on Wholesaler A (no show link)                                      |
| **Payments**          | W1 partial $50, W2 full $100; W3 none → “Last payment: —”                          |
| **Business expenses** | 13 rows — shipping, supplies, software, equipment, travel, show fees (~$853 total) |
| **Inventory**         | 12 purchases — 7 suppliers, pallets + restocks (~$9,825 total)                     |
| **Cash snapshot**     | $10,000 baseline dated one week before current week                                |
| **Strategy**          | BALANCED (30% tax reserve, 50% reinvestment, $2,000 buffer)                        |
| **Owner draw**        | $250 owner draw for current week                                                   |

Expected **event-backed** highlights:

- **Balances:** W1 partially paid (~$325 owed − $50 paid), W2 ~$20 owed, W3 unpaid $300
- **Activity:** payments, expenses, settlements, show payout, snapshot, owner draw
- **Dashboard profit:** closed show contributes **$1,200** profit this week
- **Financials recommendations:** cash movement since snapshot (inflows/outflows)

---

## 3. Pages to click and what to verify

### 3.1 /admin/financials

- Recommended allocation plan renders with estimated current cash (snapshot + ledger movement).
- Tax reserve, buffer, inventory budget, and safe owner draw cards populate.

### 3.2 /admin/financials/activity

- Timeline is **not empty** — seed payments, expenses, settlements, show payout, snapshot, owner draw.

### 3.3 /admin/shows

- Table shows all three seed shows.
- **Seed Show This Week Active:** Status **Open**, Action **Close out**.
- **Seed Show This Week Closed:** Status **Closed**, profit visible via event-backed summary.
- **Seed Show Next Week Planned:** Status **Planned**.

### 3.4 /admin/shows/[id] (Seed Show Active — ACTIVE)

- **Payout After Fees:** 1200 (editable: Edit → change → Save).
- **Settlements:** 2 rows (percent + fixed).
- **Summary & review:** Profit estimate visible (e.g. 840 = 1200 − 360).
- **Close out show** section: click **Close out show** → confirm → payout and settlements lock.

### 3.5 /admin/shows/[id] (Seed Show Closed — COMPLETED)

- Locked note for closed show.
- Event-backed profit **$1,200** (1500 payout − 300 settlement).

### 3.6 /admin/balances

- **Seed Wholesaler B (batch):** **Partially paid** (~$20 owed).
- **Seed Wholesaler A (ASAP):** **Partially paid** (settlements + vendor expense − partial payment).
- **Seed Mom Inventory:** **Unpaid**, **Last payment: —**.

### 3.7 /admin/balances/owner

- Owner weekly payout preview uses closed-show profit from events.
- Owner draw history includes seed draw.

### 3.8 /admin (Dashboard)

- **Who you still owe:** outstanding rows for seed wholesalers.
- Week/YTD profit strip includes closed seed show profit.

### 3.9 /admin/payments/new

- Record a payment for **Seed Mom Inventory** (e.g. 50).
- Submit → check **Balances**, **Activity**, and **Dashboard** update.

### 3.10 /admin/wholesalers/[id]

- Open **Seed Wholesaler A (ASAP)**.
- **Statement** section loads with settlements, vendor expense, and payments.

---

## 4. Idempotency

- `make dev-seed` is **safe to run repeatedly**.
- Seed script deletes only records in the seed namespace (named wholesalers/shows, `(seed-dev)` markers, seed payment references), removes their **`financial_events`**, then re-inserts domain rows and runs backfill.
- It does **not** delete or change non-seed dev data.
- `make dev-backfill-financial-events` is idempotent via backfill source checks (skips existing events).

---

## 5. Troubleshooting

- **DATABASE_URL:** If unset, `make dev-seed` uses `LOCAL_DB_URL` from the Makefile (e.g. `postgres://fefeave:fefeave@localhost:5432/fefeave`).
- **Connection refused:** Ensure Postgres is up (`make dev-db-up` or your own instance).
- **Migrations:** Run `make dev-migrate` before the first `make dev-seed`.
- **Activity empty / balances all zero:** Run `make dev-seed` or `make dev-backfill-financial-events`. Event-backed pages require rows in `financial_events`.
