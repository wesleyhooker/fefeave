# FefeAve — Plan (`/fe-plan`)

Create an implementation plan **before** design or code changes. Planning only — do not modify files.

## Constitution

Follow `.cursor/rules/` (especially `00-fefeave-core`, `20-product-surfaces`, `30-engineering`). Use [docs/internal/cursor-rules-index.md](../../docs/internal/cursor-rules-index.md) to find canonical docs.

FefeAve has multiple surfaces: **public marketing site**, **operator workspace**, and **portal**. Identify which surface the work affects. The operator workspace is not the whole product.

## Workflow position

**Plan → Design → Build → Audit**

This command is step 1. Output should be ready for `/fe-design` or, if design is already approved, for `/fe-build`.

## Your task

1. Review the user's request and any context they appended after `/fe-plan`.
2. Explore the codebase for existing patterns relevant to the work (components, layout, API clients, route structure).
3. Identify affected files and reusable building blocks.
4. Note risks: surface bleed (public vs operator vs portal), client-side financial logic, design-system mixing, scope creep, shared-abstraction regressions.
5. When comparing against a mockup or approved design, assess intent vs literal parity (see **Design intent vs mockup parity**).
6. Produce a concrete implementation plan with ordered steps.

## Design intent vs mockup parity

FefeAve mockups are typically the **approved design direction** and should be taken seriously. They are not always literal specifications.

Objective:

- Match the mockup closely.
- Preserve the intent of the mockup.
- Identify regressions accurately.
- Allow thoughtful improvements.
- Avoid recommending changes solely for pixel-perfect parity.

Guidance:

- Mockups represent approved direction and should generally be treated as the target experience.
- Do not assume every visual difference is a defect.
- Focus on preserving **intent, hierarchy, workflow, and user experience**.
- Distinguish between **regression**, **alternative implementation**, and **improvement**.

**Regression** — implementation is objectively worse than the approved direction; reduces clarity, usability, consistency, hierarchy, workflow, or product quality.

**Alternative implementation** — different from the mockup but preserves the same intent and user outcome.

**Improvement** — different from the mockup and reasonably better for usability, accessibility, maintainability, consistency with established FefeAve patterns, or operator workflow efficiency.

When creating plans:

- **Prioritize fixing regressions.**
- Do not automatically recommend changing alternative implementations.
- Call out possible improvements separately (not as required work unless the user asks).

Examples:

- A missing Summary card is likely a **regression**.
- A cleaner breadcrumb label may be an **alternative implementation**.
- A more accessible interaction pattern may be an **improvement**.
- A placeholder slug from a mockup is not automatically a requirement.

## Reuse & abstraction

When exploring patterns and drafting the plan:

- **Reuse first** — prefer existing shared components, layout primitives, tokens, and patterns before proposing new ones.
- **Avoid one-off styling** when a shared primitive already fits the need.
- **Do not abstract prematurely** — do not plan new shared layers for a single use case.
- **Extract shared components only when** the pattern is already repeated, clearly intended to repeat across pages, or duplication would create maintenance risk.
- **Keep local components local** when the pattern is page-specific or unlikely to recur.

In **Existing patterns**, call out specific shared primitives to reuse. In **Implementation plan**, note whether new UI should compose existing components inline or warrant extraction — default to inline/local unless reuse is obvious.

## Shared Abstraction Safety

FefeAve development should favor reusing shared primitives safely, avoiding unnecessary changes to existing abstractions, creating new abstractions when a pattern is clearly emerging, and protecting existing pages from accidental regressions.

- **Prefer composing** existing shared primitives over modifying them.
- **Reuse** shared components, layout primitives, and tokens when they already fit the problem.
- **Do not modify** shared/common components, shared layouts, design-system primitives, or global abstractions unless the task explicitly requires a cross-application change.
- **Assume** shared abstractions may be used by other pages.
- **Before modifying a shared abstraction**, identify likely affected usages and call them out in the plan.
- **If an abstraction almost fits** but needs page-specific behavior, prefer a local wrapper or page-specific component.
- **If a pattern is likely to repeat** across multiple pages, consider a new shared abstraction rather than bending an existing one.
- **Avoid one-off abstractions** for single-use scenarios.
- **Prefer local implementation first** unless reuse is obvious.
- **Minimize regression risk** to unrelated pages.

When discussing implementation approaches, explicitly identify:

- Shared primitives that can be **reused unchanged**
- Shared abstractions that would **need modification**
- Opportunities for **local wrappers**
- Opportunities for **new reusable abstractions**

## Constraints

- **Do not edit, create, or delete any files.**
- Do not redesign UI — defer visual decisions to `/fe-design`.
- Do not implement — defer to `/fe-build`.
- Stay within agreed scope; put unrequested ideas in **OPTIONAL** (not in the main plan).
- If the request touches money, balances, or ledger display, flag that server-side APIs/read-models must remain authoritative (`10-financial-domain`).

## Required output format

Use these headings exactly:

### Goal

One short paragraph: what we are building and for which product surface(s).

### Existing patterns

Bullet list of relevant patterns, components, docs, or conventions to reuse. Link paths where helpful.

### Design Assessment

When comparing current state to a mockup or approved design (omit or use "N/A" if no design reference):

- **Regressions** — gaps that weaken the approved direction; should be addressed in the plan
- **Alternative implementations** — differences that preserve intent; note whether action is needed (usually no)
- **Potential improvements** — differences that may be better than the mockup; separate from required work

### Reuse Strategy

Classify the approach using these subsections (use "None" or "N/A" when not applicable):

- **Reuse as-is** — shared primitives to compose without modification
- **Local wrapper** — page-local components that wrap shared primitives for page-specific behavior
- **New abstraction** — new shared component/pattern justified by likely reuse (state why)
- **Shared abstraction modification (if required)** — shared files that must change; list likely affected pages/usages and why modification is needed vs local composition

### Affected files

Bullet list of files or directories likely to change (best-effort; call out uncertainty). Distinguish page-local vs shared files.

### Risks

Bullet list of technical, product, or design risks (including constitution violations and cross-page regression risks).

### Implementation plan

Numbered steps an implementer can follow. Keep steps small and reviewable. Prioritize regressions over pixel parity. Note where `/fe-design` or `/fe-build` should pick up.

### OPTIONAL

Only if applicable: ideas outside scope — not part of the plan.
