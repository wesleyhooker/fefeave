# FefeAve — Build (`/fe-build`)

Implement an **approved** design specification, Figma frame, or mockup. Build only — do not redesign.

## Constitution

Follow all `.cursor/rules/` files. Use [docs/internal/cursor-rules-index.md](../../docs/internal/cursor-rules-index.md) for implementation docs.

Key constraints:

- Server is authoritative for permissions and money — no client-side financial source of truth.
- Keep **public**, **operator workspace**, and **portal** surfaces distinct.
- Do not mix public and operator design systems unintentionally.
- Prefer small, reviewable diffs (`00-fefeave-core`, `30-engineering`).

## Workflow position

**Plan → Design → Build → Audit**

This command is step 3. Requires an approved spec from `/fe-design`, attached Figma/mockup, or explicit user approval of the target design. If none exists, stop and ask for design input or run `/fe-design` first.

## Your task

1. Review the approved design spec and any context appended after `/fe-build`.
2. Implement to match the approved design — **do not redesign** unless a blocking issue requires a minimal deviation (call it out).
3. Reuse existing shared components, layout primitives, and design tokens for the correct surface before adding new ones (see **Reuse & abstraction** and **Shared Abstraction Safety** below).
4. Wire data through existing API clients and server-backed endpoints — do not add client-side balance/profit/settlement calculations.
5. Run relevant checks (e.g. lint, build, or targeted tests). Note integration tests if touching financial UI wiring per `10-financial-domain`.

## Reuse & abstraction

When implementing:

- **Reuse first** — existing shared components, layout primitives, tokens, and patterns before adding new ones.
- **Avoid one-off styling** when a shared primitive already fits (e.g. `WorkspaceSectionCard`, `workspaceUi` tokens, `@/system` on public surfaces).
- **Do not abstract prematurely** — do not extract helpers or components for a single call site.
- **Extract shared components only when** the pattern is repeated, clearly intended to repeat, or duplication would create maintenance risk.
- **Keep local components local** (`_components/` next to the page) when the pattern is page-specific.

Default: compose and ship with existing primitives. Extract only when the plan or codebase already shows the same pattern in multiple places.

## Shared Abstraction Safety

FefeAve development should favor:

1. Reusing shared primitives safely.
2. Avoiding unnecessary changes to existing shared abstractions.
3. Creating new abstractions when a new pattern is clearly emerging.
4. Protecting existing pages from accidental regressions.

Guidance:

- **Prefer composing** existing shared primitives over modifying them.
- **Reuse** shared components, layout primitives, and tokens when they already fit the problem.
- **Do not modify** shared/common components, shared layouts, design-system primitives, or global abstractions unless the task explicitly requires a cross-application change.
- **Assume** shared abstractions may be used by other pages.
- **If an abstraction almost fits** but needs page-specific behavior, prefer a local wrapper or page-specific component.
- **If a pattern is likely to repeat** across multiple pages, consider a new shared abstraction rather than bending an existing one.
- **Avoid one-off abstractions** for single-use scenarios.
- **Prefer local implementation first** unless reuse is obvious.
- **Minimize regression risk** to unrelated pages.

### Default preference order

Apply in this order unless the approved plan explicitly requires otherwise:

1. **Reuse existing primitive as-is**
2. **Local composition** (inline in page/view)
3. **Local wrapper** (page-local component wrapping a shared primitive)
4. **New reusable abstraction** (when pattern is clearly emerging across pages)
5. **Modification of existing shared abstraction** (last resort)

### Before modifying any shared abstraction

If step 5 is necessary:

- **List affected usages** if known (grep, imports, or plan references).
- **Explain why modification is safer** than local composition or a wrapper.
- **Request approval** if the change may affect unrelated pages — do not proceed with shared changes until confirmed when impact is unclear or broad.

Shared abstractions include (non-exhaustive): `frontend/system/`, `workspace/` components, `workspaceUi.ts`, `workspaceDesignTokens.ts`, shared layout helpers, and cross-route `_components/` under `app/(admin)/admin/_components/`.

## Constraints

- Match approved hierarchy, spacing, and component choices unless explicitly told otherwise.
- Do not expand scope — put extras in **OPTIONAL**.
- Do not modify `.cursor/rules/` files.
- If the design spec is ambiguous, make the smallest reasonable choice, state the assumption in output, and flag for `/fe-audit`.

## Required output format

Use these headings exactly:

### Files changed

List of created/modified/deleted files with one-line purpose each. Mark shared vs page-local files.

### Components used

Existing components, tokens, and patterns reused; note anything newly introduced. Note any shared abstractions modified and why.

### Visual changes

Concise summary of what changed from a user-visible perspective.

### Checks/tests run

Commands run and results. If skipped, state why.

### Risks

Remaining gaps, deviations from spec, cross-page regression risks, or follow-up needed.

### OPTIONAL

Only if applicable: improvements not implemented.
