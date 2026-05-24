# Fefe Ave — Colors

Neutral warm palette with restrained accents. Most of the UI stays neutral; accents are used for emphasis and key actions.

---

## Primary (neutral) palette

| Name          | HEX       | Use                                               |
| ------------- | --------- | ------------------------------------------------- |
| **Cream**     | `#FAF8F5` | Page backgrounds, cards, airy base                |
| **Warm Sand** | `#EBDED2` | Secondary backgrounds, trust bar, subtle sections |
| **Stone**     | `#D1C5B8` | Borders, dividers, secondary UI edges             |
| **Charcoal**  | `#2C2C2C` | Primary body text, buttons (on light)             |

**Intention:** Neutrals set a warm, calm base. Avoid cold grays or pure white for large areas on the public site.

---

## Accent colors

| Name           | HEX       | Use                                                             |
| -------------- | --------- | --------------------------------------------------------------- |
| **Soft Gold**  | `#B8A060` | Primary accent: main CTAs, key icons, highlights                |
| **Blush Pink** | `#E5D4D4` | Optional: very subtle highlights, hover states, decorative only |
| **Sage Green** | `#9CAF88` | Optional: success, nature cues, decorative only                 |

---

## How to use accents

- **Sparingly** — Most backgrounds and surfaces stay Cream, Warm Sand, or Stone. Accents are for focus, not fill.
- **Soft Gold is primary** — Use for:
  - Primary buttons (e.g. “Join the next live,” “Contact Us”)
  - Icon outlines or fills in trust bars and feature cards
  - Key highlight elements (e.g. active nav, important labels)
- **Blush and Sage are secondary** — Use only for:
  - Subtle hover or secondary emphasis
  - Small decorative or supportive elements
  - Never as the main CTA or dominant block color
- **Public marketing site** — Prefer neutrals and charcoal; Soft Gold for primary actions; blush/sage sparingly.

---

## Admin workspace (internal)

Admin uses **additive semantic CSS variables** in [`frontend/system/tokens.css`](../frontend/system/tokens.css) (Tailwind `admin.*`). Legacy rose/blush tokens (`admin-brand`, `surfaceActive`, …) remain for compatibility; **new chrome** prefers:

| Role                           | Token direction                                 | Notes                                                                                        |
| ------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Page canvas                    | `--admin-canvas`                                | Warm off-white shell                                                                         |
| Sidebar                        | `--admin-sidebar-surface`                       | **Deeper clay** than CTAs                                                                    |
| Primary buttons / accent rails | `--admin-action-primary`                        | **Brighter terracotta** (same family as sidebar, not identical)                              |
| Content cards                  | `--admin-surface-elevated` + `--admin-border`   | Clean white with warm border                                                                 |
| KPI tiles                      | `--admin-kpi-soft` / `accent` / `gold` / `sage` | Peach default; stronger peach for liability; gold completed; sage reserved for ops/attention |
| Muted strips                   | `--admin-muted-strip`                           | Inset chrome bands                                                                           |

Dense ledgers and tables stay **neutral** (gray/stone utilities); semantic greens/reds for money and status are unchanged.

---

## Public marketing site (`public-site`)

The `(public)` layout root uses class `public-site`, which **re-scopes CSS variables** (see `tokens.css`) without changing global `:root` values used elsewhere (e.g. admin).

| Token on `.public-site`             | Effect                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `--fefe-gold` / `--fefe-gold-hover` | Richer trust-gold hue (`#A87522` / `#8F6219`) for CTAs, eyebrows, links, icons |
| `--fefe-trust-gold`                 | Aliased to public gold (one accent family)                                     |
| `--fefe-icon-well`                  | Uses `--fefe-sand-muted` for icon wells on cream                               |

**Sand-muted** (`#EDE4D8`) is for micro accents (wells, placeholders, header hover pills), not full-width bands. Large public sections use **Cream** only (Phase A).

---

## Quick reference

- **Backgrounds:** Cream, Warm Sand (public homepage sections → Cream canvas).
- **Borders / dividers:** Stone.
- **Body text:** Charcoal.
- **Primary actions & key icons:** Soft Gold.
- **Secondary accents:** Blush Pink, Sage Green — minimal, optional.
