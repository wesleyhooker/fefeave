# FefeAve Deliverables Roadmap (Table of Contents)

1. **Deliverable 1 — Inventory/ledger tracking foundation** (Sheets/Form baseline + data structure)
2. **Deliverable 2 — Authentication wiring**
   - Auth plugin (dev_bypass + Cognito-ready)
   - `request.user` context
   - Guards (`requireAuth`, `requireRole`)
   - `GET /api/users/me`
   - Swagger bearer scheme
   - Automated smoke tests
3. **Deliverable 3 — Database foundation**
   - Postgres wiring (`pg`), transactions helper
   - Migrations system (node-pg-migrate)
   - Local dev DB (docker compose)
   - Core schema migration (ledger tables)
   - Integration smoke tests + one-command runner
   - Payments optional `show_id` + indexes
4. **Deliverable 4 — Admin ledger API (show-first)**
   - Shows API (create/list/get)
   - Wholesalers API (create/list)
   - Owed line items under show (create/list)
   - Show summary (totals per wholesaler + overall)
   - Payments API (create/list; optional show_id)
   - Wholesaler statement (computed balance + history)
5. **Deliverable 5 — Attachments**
   - Presigned S3 upload/download
   - Attachments linked to show/line item/payment
6. **Deliverable 6 — Admin UI v1 (Felicia dashboard)**
   - Auth + protected admin routes
   - Shows list + create show
   - Show detail + add owed line items
   - Wholesalers list + quick add
   - Record payments
7. **Deliverable 7 — Reporting**
   - Balances dashboard
   - Export (CSV) for accountants/wholesalers
8. **Deliverable 8 — Portals (optional)**
   - Wholesaler read-only statement portal
   - Customer-facing pages (optional)
9. **Deliverable 9 — Analytics & automation (optional)**
   - Show performance metrics
   - Operational automations (reminders, reconciliations)
