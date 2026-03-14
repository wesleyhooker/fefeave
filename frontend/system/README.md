# Fefe Ave — Design System

Reusable UI primitives that implement the **[/design](/design)** documentation (colors, typography, spacing, components).

Use for the **public marketing site** and the **admin dashboard**. Design tokens are in `tokens.css` and extended in `tailwind.config.ts`.

## Usage

```ts
import { Button, Card, Container, Heading, Prose, Nav, NavLink } from "@/system";
```

## Components

| Component     | Purpose                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------- |
| **Button**    | Primary (gold), secondary (stone border), tertiary (link). Sizes: sm, md, lg.                       |
| **Card**      | 12px radius, soft shadow, 24px padding. Subcomponents: CardHeader, CardTitle, CardBody, CardFooter. |
| **Container** | Max-width 1200px (default) or 640px (narrow), centered, horizontal padding.                         |
| **Heading**   | H1–H4 with Playfair (1–3) or Inter (4). Use for headings only.                                      |
| **Prose**     | Body text block; Inter, relaxed line height.                                                        |
| **Nav**       | Flex container (row/column). **NavLink** for links with optional active state (gold).               |

## Tokens (Tailwind)

- **Colors:** `fefe-cream`, `fefe-warm-sand`, `fefe-stone`, `fefe-charcoal`, `fefe-gold`, `fefe-gold-hover`, `fefe-blush`, `fefe-sage`
- **Spacing:** `fefe-1` … `fefe-7` (8px–80px)
- **Fonts:** `font-fefe` (body), `font-fefe-heading` (Playfair)
- **Radius:** `rounded-fefe-card`, `rounded-fefe-button`
- **Shadow:** `shadow-fefe-card`
- **Max width:** `max-w-fefe-container`, `max-w-fefe-narrow`

## Design reference

See repo root **/design** for:

- brand.md, colors.md, typography.md, spacing.md, components.md, imagery.md, homepage.md
