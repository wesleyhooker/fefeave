# Public marketing components (`(public)`)

Homepage and static marketing pages. The **reseller workspace** (`/admin/*`) uses a separate UI system under `app/(admin)/admin/` — not these components.

## Public header (cross-route, public-only)

| Location                                            | Role                            |
| --------------------------------------------------- | ------------------------------- |
| `app/_components/headers/PublicHeader.tsx`          | Marketing site chrome           |
| `app/_components/headers/publicHeaderControls.ts`   | Nav link classes                |
| `app/_components/headers/PublicAccountDropdown.tsx` | Account menu (`fefe-*` styling) |

Reseller workspace top bar: `app/(admin)/admin/_components/headers/` (not `app/_components/headers/`).
| `app/_components/icons/HeartIcon.tsx` | Editorial eyebrow (default icon) |
| `lib/public/publicLinks.ts` | Env-driven Whatnot/TikTok/footer URLs |
| `@/system` | Button, Card, Container, Heading, Prose |

## Public-only layout

| Path                        | Role                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `shell/publicShell.ts`      | `publicSiteClass`, surfaces, typography, `HomepageContainer` |
| `shell/publicCtaClasses.ts` | Link styles mirroring system buttons                         |
| `shell/PublicPageMain.tsx`  | Cream `<main>` wrapper for about/contact/how-it-works        |

## Editorial

| Path                                | Role                                     |
| ----------------------------------- | ---------------------------------------- |
| `editorial/EditorialEyebrow.tsx`    | Micro uppercase labels                   |
| `editorial/BrushUnderline.tsx`      | Hero headline accent                     |
| `editorial/PublicSectionHeader.tsx` | Eyebrow + H2 block for homepage sections |

## Homepage

| Path                    | Role                                               |
| ----------------------- | -------------------------------------------------- |
| `HomeHeroSection.tsx`   | Hero grid + collage                                |
| `HeroDropsAnnounce.tsx` | Inline platform marks                              |
| `platform-logos.tsx`    | Whatnot/TikTok SVG marks                           |
| `HomeSectionImage.tsx`  | Image with sand-muted fallback                     |
| `live/`                 | Platform cards, experience row, live story wrapper |

## Tokens

Public accent overrides live in `frontend/system/tokens.css` under `.public-site` (applied in `(public)/layout.tsx`).
