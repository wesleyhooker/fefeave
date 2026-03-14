# FefeAve SaaS Productization Plan

**Status:** Planning only. No implementation in this pass.  
**Current state:** Single-tenant internal tool (one business, Cognito auth, no tenant/org model).

---

## 1. Tenant / org model

- Introduce an **organization** (org) as the top-level tenant. All business data is scoped to an org.
- **Schema:** Add `organizations` table (id, name, slug, created_at, updated_at, deleted_at). Add `organization_id` (FK, NOT NULL) to every tenant-scoped table: shows, wholesalers, payments, owed_line_items, attachments (or org inferred via entity), balances view backing tables, etc.
- **API:** Every list/mutation accepts or infers org context (e.g. from authenticated user’s org membership). No cross-org data access.

---

## 2. Row-level tenant isolation

- **Enforcement:** All queries that read or write tenant data MUST filter (and, for writes, set) `organization_id`. Use a single place to resolve “current org” (e.g. from JWT claim, session, or explicit header for server-to-server).
- **Guards:** Middleware or repository layer that injects `organization_id` into queries and rejects requests that don’t have a valid org context.
- **Indexes:** Add composite indexes (organization_id, …) on high-traffic tables to keep tenant isolation efficient.

---

## 3. User-to-org membership model

- **Schema:** Add `organization_members` (or `user_organizations`): user_id, organization_id, role, created_at. One user can belong to multiple orgs.
- **Auth:** Extend Cognito (or session) to include “current org” and “org role” (e.g. via custom attributes, or a small service that resolves user → org memberships and caches in session/JWT).
- **Scoping:** Backend resolves “current org” from request (e.g. `X-Org-Id` header or session claim) and uses it for all data access.

---

## 4. Org-scoped roles

- **Model:** Roles are per-org (e.g. ADMIN, OPERATOR within that org). Global “superadmin” can be a separate concept (e.g. platform admin) for support only.
- **Backend:** Replace or extend current role checks to “user has role X in org Y.” Use membership table + role column (or role table per org).
- **Portal:** Wholesaler/portal access remains per-org (wholesalers belong to an org; portal users see only that org’s data).

---

## 5. Onboarding flow

- **Self-serve (optional):** Public signup that creates a new org + first user as org admin. Requires email verification and possibly approval.
- **Admin-created:** Platform or existing org admin creates org, invites users (email), and assigns roles. Invite flow: email link → set password / SSO → join org.
- **First-time experience:** After signup or invite, minimal onboarding (org name, timezone, maybe branding) then redirect into the app (dashboard).

---

## 6. Branding / config

- **Per-org:** Store in `organizations` or `organization_settings`: name, logo URL, primary color, support email. Optional: custom domain per org (requires DNS + routing).
- **UI:** Header, login page, and emails use org branding when in org context. Public/marketing site can remain shared or become a template.

---

## 7. Billing / subscription

- **Model:** Subscription per org (e.g. monthly/annual). Optional: usage-based (e.g. number of shows or users).
- **Provider:** Integrate Stripe (or similar): products/plans, customer per org, subscription lifecycle (create, update, cancel). Webhooks to keep subscription status in sync.
- **Schema:** Add `subscriptions` or `org_subscriptions`: organization_id, stripe_customer_id, stripe_subscription_id, plan_id, status, current_period_end. Gate features or show upgrade prompts by status.
- **No billing in this pass:** Design only; implement when moving to paid multi-tenant.

---

## 8. Migration from current single-tenant data

- **Single default org:** Create one organization (e.g. “Fefe Ave”) and set its id as the default.
- **Backfill:** One-time migration: set `organization_id` on all existing rows to that default org id. Add NOT NULL and FK after backfill.
- **Users:** Create `organization_members` rows for existing users, all linked to the default org with current roles (ADMIN/OPERATOR).
- **Wholesalers / portal:** Ensure wholesalers and portal users are already scoped (e.g. via existing FKs); attach them to the default org if needed.
- **Downtime:** Prefer a short maintenance window: add nullable `organization_id`, backfill, add NOT NULL + FK, deploy code that enforces org. Then remove any bypass logic.

---

## Recommended order of operations

1. **Schema + migration (tenant/org)**  
   Add `organizations`, add `organization_id` to tenant-scoped tables, backfill default org, add constraints and indexes.

2. **User–org membership**  
   Add `organization_members`, backfill existing users to default org. Auth/session returns current org + role.

3. **Row-level isolation**  
   Enforce org in all queries and mutations; remove any single-tenant assumptions. Test thoroughly (no cross-org leakage).

4. **Org-scoped roles**  
   Switch role checks to org-scoped; add “switch org” or “current org” in UI for users in multiple orgs.

5. **Onboarding**  
   Implement “create org + first admin” and/or “invite user to org” flows. Optional: self-serve signup.

6. **Branding / config**  
   Per-org settings and UI use of org name/logo. Optional: custom domain.

7. **Billing (when needed)**  
   Stripe integration, subscription state, and feature gating by plan.

---

## Out of scope for this plan

- Multi-region or data residency.
- Detailed Stripe product/price design.
- Custom domain implementation details.
- Advanced RBAC (e.g. custom roles per org).
