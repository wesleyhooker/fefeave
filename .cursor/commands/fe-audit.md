# FefeAve — Audit (`/fe-audit`)

Compare **implementation** against an **approved design** (spec, Figma frame, or mockup). Audit only — do not redesign or implement fixes unless the user explicitly asks.

## Constitution

Follow `.cursor/rules/` (especially `20-product-surfaces`, `10-financial-domain`). Use [docs/internal/cursor-rules-index.md](../../docs/internal/cursor-rules-index.md) for design system references.

Audit for:

- Surface correctness (public vs operator vs portal — not treating the whole site as operator workspace)
- Design-system compliance (no unintentional mixing of public and operator tokens/components)
- Financial UI displaying server-backed data only (no client-side source-of-truth rollups)
- Workflow-oriented structure vs table/entity-oriented drift (operator workspace)

## Workflow position

**Plan → Design → Build → Audit**

This command is step 4. Requires both an implementation to review (files, branch, or URL) and an approved design reference. If either is missing, ask for it.

## Audit philosophy

FefeAve mockups are typically the **approved design direction** and should be taken seriously. They are not always literal specifications.

Objective:

- Match the mockup closely.
- Preserve the intent of the mockup.
- Identify regressions accurately.
- Allow thoughtful improvements.
- Avoid recommending changes solely for pixel-perfect parity.

Guidance:

- Compare the implementation against the approved mockup.
- Preserve the **intent** of the mockup — hierarchy, workflow, clarity, and operator experience.
- Do not optimize for pixel-perfect matching.
- Favor user experience, clarity, accessibility, maintainability, and established FefeAve patterns over exact visual duplication.
- Identify where the implementation diverges.
- Classify each meaningful divergence as **regression**, **alternative implementation**, or **improvement**.
- Do not recommend changes solely because the mockup used different wording, placeholder values, route segments, or visual treatment.
- Consider whether the current implementation better fits the real product.
- **Explain why a divergence matters** before recommending a change.

**Regression** — the implementation weakens the approved design direction (clarity, usability, consistency, hierarchy, workflow, or product quality).

**Alternative implementation** — the implementation differs but achieves the same outcome and quality level.

**Improvement** — the implementation differs and is arguably better than the mockup (usability, accessibility, maintainability, FefeAve patterns, operator efficiency).

Examples:

- A missing Summary card is likely a **regression**.
- A cleaner breadcrumb label may be an **alternative implementation**.
- A more accessible interaction pattern may be an **improvement**.
- A placeholder slug from a mockup is not automatically a requirement.

## Your task

1. Review the implementation (code, screenshots, or running UI if available).
2. Compare against the approved design spec or visual reference.
3. **Do not redesign** — classify and report drift only.
4. Evaluate: spacing, alignment, hierarchy, component consistency, responsiveness, empty/loading/error states, and design-system compliance — weighted by intent, not pixels alone.
5. Prioritize regressions for `/fe-build` follow-up; do not treat every difference as a defect.

## Constraints

- **Do not modify files** unless the user explicitly requests fixes in the same message.
- Do not propose scope expansion — optional ideas go in **OPTIONAL**.
- Do not recommend fixes for alternative implementations or improvements unless the user asks to pursue mockup literalism.

## Required output format

Use these headings exactly:

### Pass/fail summary

One paragraph: overall verdict (Pass / Pass with issues / Fail) based primarily on **regressions**, not pixel parity. Explain why.

### Regressions

Changes that should normally be fixed. Each item: location, expected (mockup intent), actual, impact, why it matters.

Use "None" if no regressions found.

### Alternative implementations

Differences that may not require action — same intent and outcome, different execution. Explain why action is optional.

Use "None" if not applicable.

### Improvements

Differences that should be considered acceptable or potentially preferred over the mockup. Explain the benefit.

Use "None" if not applicable.

### Recommended fix order

Numbered list — regressions only, ordered for efficient `/fe-build` follow-up. Omit or note "No regressions to fix" when appropriate.

### OPTIONAL

Only if applicable: enhancements beyond fixing regressions — not required for pass.
