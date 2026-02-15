# FefeAve Roadmap

## Version 1 — Admin Financial Control System

**Objective:**
Establish FefeAve as a reliable financial source of truth for show settlements, wholesaler obligations, and payments — fully replacing spreadsheet-based tracking.

---

## Phase 1 — Backend Platform Foundation

**Focus:** Authoritative financial backend and ledger core.

### Epic 1.1 — Authentication & Access Control
* Dev bypass mode
* Cognito-ready JWT verification
* `request.user` context wiring
* Role-based guards (`requireAuth`, `requireRole`)
* `/api/users/me`
* Swagger bearer integration
* Smoke test coverage

---

### Epic 1.2 — Database & Ledger Infrastructure
* Postgres integration (`pg`, pooling, transactions)
* Migration framework
* Local Docker development database
* Core financial schema (shows, financials, settlements, payments, wholesalers)
* Indexing strategy for ledger queries
* Integration test harness (DB + automation)

---

### Epic 1.3 — Settlement & Ledger API
* Shows API (create, list, get)
* Show financials API (payout after fees)
* Settlement creation (manual & percent-of-payout)
* Payments API (cross-show)
* Wholesaler balances endpoint
* Wholesaler statement endpoint (ledger view)

---

## Phase 2 — Attachments & Evidence Handling

**Focus:** Support auditability and payout proof storage.

### Epic 2.1 — Secure File Uploads
* Presigned S3 upload
* Presigned S3 download
* Access control enforcement

### Epic 2.2 — Attachment Linking
* Link attachments to shows
* Link attachments to settlements and payments
* Soft-delete handling

---

## Phase 3 — Admin Interface (Felicia Dashboard)

**Focus:** Replace spreadsheets with a structured logging UI.

### Epic 3.1 — Admin Access & Layout
* Auth integration
* Protected admin routes
* Core dashboard layout

### Epic 3.2 — Show Workflow UI
* Create & manage shows
* Enter payout after fees
* Create settlements per wholesaler
* Review profit estimate

### Epic 3.3 — Wholesaler & Payment Management
* Wholesaler list & balances view
* Record payments
* View wholesaler statements

---

## Phase 4 — Reporting & Export

**Focus:** Financial clarity and accountant-ready outputs.

### Epic 4.1 — Balances Dashboard
* Aggregated wholesaler balances
* Summary financial overview

### Epic 4.2 — Data Export
* CSV export of ledger data
* Accountant-friendly formatting

---

## Phase 5 — External Portals (Optional)

**Focus:** Controlled visibility for stakeholders.

### Epic 5.1 — Wholesaler Read-Only Portal
* Authenticated statement access
* Downloadable statement exports

### Epic 5.2 — Customer-Facing Pages (Optional)
* Public-facing brand presence
* Non-admin informational pages

---

## Phase 6 — Analytics & Operational Automation (Optional)

**Focus:** Optimization and leverage.

### Epic 6.1 — Show Performance Metrics
* Profit trends
* Settlement breakdowns

### Epic 6.2 — Operational Automations
* Payment reminders
* Balance alerts
* Reconciliation helpers

---

# Version 1 Completion Criteria

Version 1 is complete when:
* Felicia can log a show end-to-end.
* Settlement obligations are calculated and stored correctly.
* Payments reduce balances accurately.
* Wholesaler balances and statements are reliable.
* Spreadsheet tracking is no longer required.
