# Dev E2E runbook (“Felicia day” workflow)

Use this to run a full dev end-to-end pass with seeded data. **Dev only** — no prod seeding or prod code paths.

---

## 1. Commands to run

From repo root:

```bash
# Start Postgres (if not already running)
make dev-db-up

# Run migrations
make dev-migrate

# Seed dev data (idempotent — safe to run repeatedly)
make dev-seed

# Start backend + frontend (pick one)
make dev-api          # Terminal A: backend on :3000 (dev_bypass auth)
make dev-ui           # Terminal B: frontend on :3001
# Or use make dev-tmux to run both in split panes
```

Then open: **http://localhost:3001/admin**

---

## 2. Expected seeded entity names (for fast testing)

| Type        | Names                                                                         |
| ----------- | ----------------------------------------------------------------------------- |
| Wholesalers | `Seed Wholesaler A (ASAP)`, `Seed Wholesaler B (batch)`, `Seed Mom Inventory` |
| Shows       | `Seed Show Active`, `Seed Show Closed`                                        |

- **Seed Show Active:** ACTIVE, payout 1000, 2 settlements (percent + fixed).
- **Seed Show Closed:** COMPLETED, payout 500, 1 settlement.
- **Payments:** W1 partial (50), W2 full (100). W3 has no payments → “Last payment: —”.

---

## 3. Pages to click and what to verify

### 3.1 /admin/shows

- Table shows **Seed Show Active** and **Seed Show Closed**.
- **Seed Show Active** row: Status **Open**, Action **Close out**.
- **Seed Show Closed** row: Status **Closed**, Action **View**.
- Click **Close out** on Seed Show Active → goes to show detail.

### 3.2 /admin/shows/[id] (Seed Show Active — ACTIVE)

- **Payout After Fees:** 1000 (editable: Edit → change → Save).
- **Settlements:** 2 rows (percent + unit cost / fixed).
- **Summary & review:** Profit estimate visible (e.g. 700).
- **Close out show** section: click **Close out show** → confirm → payout and settlements lock; status becomes Closed.

### 3.3 /admin/shows/[id] (Seed Show Closed — COMPLETED)

- Locked note: “This show is closed. Payout and settlements are locked…”
- Payout and Settlements show “Locked — reopen…”
- **Reopen show (unlocks payout and settlements)** → confirm → can edit again.

### 3.4 /admin/balances

- **Seed Wholesaler B (batch):** status chip **Paid** (balance 0).
- **Seed Wholesaler A (ASAP):** status chip **Partially paid**.
- **Seed Mom Inventory:** status chip **Unpaid**, **Last payment: —** (or column equivalent).

### 3.5 /admin (Dashboard)

- **Who you still owe:** rows for Seed Wholesaler A and Seed Mom Inventory (outstanding).
- “Last payment: X days ago” or “Today” for A; “Last payment: —” for Mom Inventory.

### 3.6 /admin/payments/new

- Record a payment for **Seed Mom Inventory** (e.g. 50).
- Submit → then check **Balances** and **Dashboard**: Mom Inventory status/“Last payment” update.

### 3.7 /admin/wholesalers/[id]

- Open **Seed Wholesaler A (ASAP)** (or any seed wholesaler).
- **Last payment:** “X days ago” or “Today” (for A/B) or “—” (for Mom before you record a payment).
- **Statement** section loads with settlements and payments.

---

## 4. Idempotency

- `make dev-seed` is **safe to run repeatedly**.
- Seed script deletes only records in the seed namespace (wholesalers/shows with the names above), then re-inserts the same data.
- It does **not** delete or change any other dev data.

---

## 5. Troubleshooting

- **DATABASE_URL:** If unset, `make dev-seed` uses `LOCAL_DB_URL` from the Makefile (e.g. `postgres://fefeave:fefeave@localhost:5432/fefeave`).
- **Connection refused:** Ensure Postgres is up (`make dev-db-up` or your own instance).
- **Migrations:** Run `make dev-migrate` before the first `make dev-seed`.
