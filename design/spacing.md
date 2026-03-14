# Fefe Ave — Spacing

Consistent spacing based on an 8px grid. All margins and padding should align to this scale.

---

## Grid

**Base unit:** 8px.

All spacing values should be multiples of 8 (e.g. 8, 16, 24, 32, 48, 64, 80).

---

## Spacing tokens

| Token     | Value | Typical use                                          |
| --------- | ----- | ---------------------------------------------------- |
| `space-1` | 8px   | Tight gaps (icon + label, inline elements)           |
| `space-2` | 16px  | Default gap between related items, list spacing      |
| `space-3` | 24px  | Card padding, section internal padding               |
| `space-4` | 32px  | Between blocks within a section                      |
| `space-5` | 48px  | Between subsections                                  |
| `space-6` | 64px  | Between major sections                               |
| `space-7` | 80px  | Large section separation (e.g. hero to next section) |

**Developer note:** Map these to CSS variables or design tokens (e.g. `--space-2: 16px`) so components stay consistent.

---

## Section spacing

- **Between major sections (e.g. Hero, Trust bar, How it works):** `space-6` (64px) or `space-7` (80px).
- **Between subsections or rows of cards:** `space-4` (32px) or `space-5` (48px).
- **Within a section (e.g. heading + content):** `space-3` (24px) or `space-4` (32px).

**Intention:** Generous vertical rhythm so the page feels airy and readable.

---

## Card padding

- **Default card padding:** `space-3` (24px) on all sides.
- **Tight cards (e.g. small chips or tags):** `space-1` (8px) or `space-2` (16px).

---

## Container width

- **Max content width:** ~1200px for main page content.
- **Content should be centered** with equal or proportional side margins.
- **Narrower containers** (e.g. forms, reading content) can use a smaller max-width (e.g. 640px or 720px) when appropriate.

---

## Summary

- 8px grid; use the token scale.
- Sections: 64–80px between major blocks.
- Cards: 24px padding.
- Page content: max-width ~1200px, centered.
