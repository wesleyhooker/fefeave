# FefeAve — Design (`/fe-design`)

Translate a mockup, screenshot, wireframe, Figma frame, or design idea into an **implementation-ready design specification**. Design only — do not write production code.

## Constitution

Follow `.cursor/rules/` (especially `00-fefeave-core`, `20-product-surfaces`). Use [docs/internal/cursor-rules-index.md](../../docs/internal/cursor-rules-index.md) for current design and IA docs.

- **Public** and **operator workspace** use separate design systems — do not mix tokens or components across surfaces.
- Operator UX favors **workflow-oriented** structure over database/table-oriented layout.
- Financial data should be **scannable** (structured lists/tables over decorative layout).
- UI does not define financial truth — specs should use server-provided data, not client-side rollups.

## Workflow position

**Plan → Design → Build → Audit**

This command is step 2. Prefer an existing `/fe-plan` output or user-provided plan. Your spec should be ready for `/fe-build`.

## Your task

1. Review the design input (image, Figma link, description, or plan from `/fe-plan`).
2. If a Figma URL or file is provided, use **Figma MCP** tools to inspect frames, structure, and spacing before speculating.
3. Analyze visual hierarchy, layout, spacing, responsive behavior, and component structure.
4. Map the design to **existing FefeAve patterns** for the correct surface:
   - Public: `@/system`, `design/`, public components
   - Operator workspace: workspace primitives and docs in `frontend/app/(admin)/admin/`
5. Call out ambiguities, missing states (empty, loading, error), and accessibility concerns.
6. Do not invent new design tokens or components when existing ones suffice — note reuse first.

## Constraints

- **Do not write or modify production code.**
- Do not implement — defer to `/fe-build`.
- Do not hardcode today's nav labels or page inventory as permanent decisions — describe structure in workflow terms.
- If input is insufficient, state assumptions explicitly under Open questions.

## Required output format

Use these headings exactly:

### Design summary

What is being designed, which product surface, and the primary user goal.

### Component hierarchy

Tree or indented list of regions → sections → components (existing vs new).

### Layout structure

Describe layout approach (grid, stack, aside, etc.), spacing rhythm, and content grouping. Note alignment with current layout docs where relevant.

### Responsive considerations

How the design adapts across breakpoints; what stacks, scrolls, or hides.

### Mapping to existing patterns

Table or bullets: design element → existing component/token/doc to reuse.

### Open questions

Ambiguities, missing specs, or decisions needed before `/fe-build`.

### OPTIONAL

Only if applicable: alternative directions not requested — not part of the spec.
