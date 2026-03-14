# Fefe Ave — Typography

Two fonts: one for headlines (editorial), one for body and UI (clear and neutral).

---

## Font system

| Role          | Font             | Use                                                   |
| ------------- | ---------------- | ----------------------------------------------------- |
| **Headings**  | Playfair Display | Hero, section titles, card titles, editorial emphasis |
| **Body & UI** | Inter            | Paragraphs, labels, buttons, nav, forms, tables       |

---

## Rules

1. **Playfair Display only for headings** — Never for paragraphs or long copy. Keeps the editorial feel without hurting readability.
2. **Never use Playfair for body text** — Body and UI stay in Inter for consistency and legibility.
3. **Admin UI** — Prefer Inter everywhere. Use Playfair only for rare, high-level titles (e.g. dashboard or app name) if desired; otherwise Inter only.

---

## Heading hierarchy (public site)

| Level  | Font                           | Typical use                               | Example                                |
| ------ | ------------------------------ | ----------------------------------------- | -------------------------------------- |
| **H1** | Playfair Display               | Hero headline, single main title per page | “Catch the next drop!”                 |
| **H2** | Playfair Display               | Section titles                            | “Track your sales. Know every payout.” |
| **H3** | Playfair Display or Inter Bold | Card titles, subsections                  | “Join live shows,” “Meet Felicia”      |
| **H4** | Inter Bold                     | Small section headers, list titles        | —                                      |

**Intention:** One clear H1 per page. H2s break the page into sections. H3/H4 support scanning without competing with the main headline.

---

## Body and UI

- **Body copy:** Inter, regular weight. Comfortable line height (e.g. 1.5–1.6).
- **Small text / captions:** Inter, same family; reduce size only.
- **Labels, buttons, nav:** Inter. Medium or semibold for emphasis.

---

## Summary

- **Playfair** = headings only, editorial tone.
- **Inter** = everything else: body, UI, admin.
- Keep hierarchy simple so developers and designers can apply it consistently.
