# Fefe Ave — Components

Base UI primitives for the future `/system` component library. These rules keep buttons, cards, navigation, and containers consistent across public site and admin.

---

## Buttons

### Primary button

- **Background:** Soft Gold (`#B8A060`)
- **Text:** White
- **Corners:** Rounded (e.g. 8px radius, or match design token)
- **Use for:** Main CTAs — “Join the next live,” “Contact Us,” “Submit,” “Save”

**Intention:** One primary action per block. Stands out without feeling loud.

### Secondary button

- **Background:** White (or Cream)
- **Border:** Stone (`#D1C5B8`), light weight (1px)
- **Text:** Charcoal (`#2C2C2C`)
- **Corners:** Rounded (same as primary)
- **Use for:** Secondary actions — “Follow on Whatnot,” “View schedule,” “Cancel”

### Tertiary / link

- **Background:** Transparent or none
- **Text:** Charcoal; optional underline or gold on hover
- **Use for:** “View schedule,” “Read our story,” low-emphasis actions

---

## Cards

- **Radius:** 12px
- **Border:** Light stone (optional; can rely on shadow alone)
- **Shadow:** Soft, subtle (e.g. light gray, low blur, small offset)
- **Padding:** 24px (`space-3`)

**Intention:** Cards feel like content blocks, not heavy panels. Consistent padding makes layout predictable.

---

## Navigation

- **Public site:** Logo (left), main links (center or left), optional icons (e.g. social, notifications), primary CTA (right). Use Inter for labels; gold for active or primary CTA.
- **Admin:** Same Inter + charcoal; primary actions in gold. Minimal decoration; focus on clarity and hierarchy.
- **Spacing:** Comfortable tap/click targets; align item spacing to 8px grid (e.g. 16px or 24px between items).

---

## Containers

- **Page container:** Max-width ~1200px, centered, horizontal padding (e.g. 24px or 32px) so content doesn’t touch viewport edges.
- **Section container:** Full-width sections can still wrap inner content in the same max-width container for alignment.
- **Narrow container:** For forms or reading-heavy content, optional max-width (e.g. 640px) for better line length.

---

## Summary

| Component        | Key specs                                            |
| ---------------- | ---------------------------------------------------- |
| Primary button   | Gold bg, white text, rounded                         |
| Secondary button | White/Cream bg, stone border, charcoal text, rounded |
| Card             | 12px radius, soft shadow, 24px padding               |
| Container        | Max-width ~1200px, centered, padded                  |
| Nav              | Inter, clear hierarchy; gold for primary/active      |

These primitives will be implemented in `/system`; design tokens (colors, spacing) should reference `colors.md` and `spacing.md`.
