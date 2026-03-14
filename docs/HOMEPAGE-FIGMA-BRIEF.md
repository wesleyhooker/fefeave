# FefeAve Homepage — Figma design brief & content structure

Design direction: **public site = Warm / Live / boutique brand**; workspace stays clean and product-focused. This doc supports multiple homepage visual concepts in Figma before any broad code changes.

---

## 1. Current homepage audit

### Existing sections (in order)

| Section                         | Purpose                                                                                                  | Status                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Hero**                        | Headline + one paragraph (live sales, Whatnot, wholesale-friendly).                                      | Solid message; no imagery, no CTA.                                                                             |
| **About Fefe Ave**              | Who runs it (Felicia), origin (May 2024, Instagram → Whatnot), focus (fair prices, clear communication). | Good trust; text-only, no face or product.                                                                     |
| **Live sales & upcoming drops** | How shopping works (live, curated drops, wholesale lots).                                                | One bullet is placeholder: “As the shop grows, this section will call out upcoming lives…” — feels unfinished. |
| **Contact**                     | Email, Instagram, Whatnot. Card layout.                                                                  | Clear and usable.                                                                                              |

### Homepage weaknesses

- **Visually dead:** No photos, no product shots, no screenshot of the product. Entire page is type + icons; no lifestyle or “proof” imagery.
- **Weak/placeholder copy:** “As the shop grows, this section will call out upcoming lives and featured finds in one easy place” reads like internal roadmap, not customer-facing.
- **No product visibility:** Shoppers and resellers don’t see what FefeAve _is_ as a tool (portal, statements, clarity on payouts). No dashboard/shop preview.
- **Trust signals missing:** No receipts/payout clarity, no “how we work with resellers,” no social proof (testimonial, partner mention) even if light.
- **No clear primary CTA:** Hero has no button (e.g. “Join a live” or “Shop on Whatnot”). Contact is the only soft CTA.
- **Duplicate “who we are”:** Hero and About both explain “live-sale shop, Whatnot, Felicia” in similar words; could be one clearer story.
- **Shop page is separate:** “Best way to shop” lives on /shop; homepage doesn’t direct there or surface one clear “go shop” path.

### Where imagery/media would help most

1. **Hero:** One strong visual (Felicia live, racks, or a clean product flat lay) to set tone and prove “real shop.”
2. **Product/trust:** Screenshot or mock of reseller portal or “your statement” so wholesale partners see clarity and professionalism.
3. **Live/social:** Whatnot or Instagram still, or a “join the next live” card with date/platform.
4. **About:** Optional small photo (Felicia or shop) to reinforce “person behind the brand.”

### Best information architecture (high level)

- **Above the fold:** Who this is, what they get (live + finds + clarity for resellers), one primary action.
- **Middle:** How it works (live + drops + portal/statements); light proof (product shot or receipt/payout clarity).
- **Close:** Short about, then contact + secondary CTAs (follow, shop, portal).

---

## 2. Recommended homepage section order

Use this order for Figma and future build. Sections are scoped so they stay realistic and usable, not vague marketing.

| Order | Section             | Content / purpose                                                                                                                                                                                                                                                      |
| ----- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | **Hero**            | One headline (e.g. “Live sales. Fabulous finds.” or variant), one supporting line (live-sale shop, Whatnot, wholesale-friendly). Primary CTA: “Join a live on Whatnot” or “Shop on Whatnot.” Optional: single hero image (live, racks, or product).                    |
| 2     | **Product preview** | Short “See your numbers” or “Clear payouts & statements” block. One product screenshot (dashboard or portal statement) + 1–2 benefit lines. For resellers: “Know what you’re owed. Get your statement.” No feature list; one clear idea.                               |
| 3     | **How it works**    | 3 short steps: (1) Join lives or shop drops, (2) Order / partner with Fefe Ave, (3) Get clear statements and payouts (link to portal for existing partners). Keeps “live + reseller” story in one place.                                                               |
| 4     | **Live & drops**    | What “live” means (Felicia walks through pieces, claim before static listing). Curated drops and wholesale lots. **Replace placeholder bullet** with either a concrete “Next live” teaser (date/TBD) or “Follow on Whatnot for schedule.” No “as the shop grows” copy. |
| 5     | **Trust / clarity** | One compact block: receipts, payouts, and clear communication. Copy like “Real receipts. Clear payouts. No guesswork.” Optional: tiny receipt or payout UI crop (blurred if needed). For resellers and serious shoppers.                                               |
| 6     | **About Fefe Ave**  | Short: Felicia, May 2024, Instagram → Whatnot, fair prices and clear communication. Optional: small photo. Stays human and boutique.                                                                                                                                   |
| 7     | **Contact & CTAs**  | Email, Instagram, Whatnot (current contact card). Optional: repeat “Shop on Whatnot” or “Open portal” so the page ends with action.                                                                                                                                    |

Rationale: Hero answers “what is this” and gives one action. Product preview and “how it works” build trust and explain value fast. Live & drops and trust/clarity speak to both shoppers and resellers. About and contact close with personality and ways to reach out.

---

## 3. Figma-ready brief: three homepage concepts

Use these three directions for **3 separate Figma homepage concepts** (same section order, different visual treatment). Design direction for the **public** site is Warm / Live / boutique; workspace stays clean and product-focused in-app only.

---

### Concept A: Warm premium reseller

- **Visual personality:** Calm, approachable, “small business you can trust.” Feels like a friendly boutique, not a startup. Warm and human; premium without being cold or corporate.
- **Palette direction:** Warm neutrals (stone, cream, warm gray). One soft accent (terracotta, sage, or dusty rose). Text: gray-900 or near-black. Avoid cold blue-grays. Section backgrounds: white + very light warm tint (e.g. cream/50).
- **Typography feel:** Serif or soft rounded sans for headings (e.g. Lora, Source Serif, or Fraunces). Clean sans for body; slightly generous body size. No techy or heavy display fonts.
- **Button/card style:** Rounded (e.g. rounded-xl). Primary: warm accent fill; secondary: light border. Cards: light border, soft shadow or none. CTAs feel inviting, not loud.
- **Imagery/media guidance:** Hero: one warm photo (live moment, racks, or curated flat lay). About: optional small portrait or shop detail. Product screenshot: in a soft card or with warm border so it doesn’t feel cold. Prefer natural light, warm tones.
- **Feeling it should create:** “This is a real person running a real shop; I can trust the numbers and the communication.”
- **Best serves:** Wholesale partners and resellers who care about clarity and relationship; shoppers who want a human, boutique feel.

---

### Concept B: Clean product

- **Visual personality:** Polished, “finished product.” Clear hierarchy and spacing; professional but not corporate. Public site feels like the front door to a serious tool.
- **Palette direction:** Neutral gray base (slate or blue-gray). Single accent (e.g. one blue or green) for CTAs and key elements. High contrast text; muted secondary. Can share a token with workspace for consistency later.
- **Typography feel:** One clear sans (e.g. Inter, DM Sans, Geist). Tight heading tracking; comfortable body line-height. Clear scale: hero 2xl/4xl, section xl, body base.
- **Button/card style:** rounded-lg or rounded-xl. Cards: border-gray-200, shadow-sm. Primary: solid dark or accent; secondary: outline. Hover/focus obvious. Feels like the same system as the workspace.
- **Imagery/media guidance:** Hero: optional product screenshot or clean lifestyle shot. Product preview: dashboard or portal screenshot prominent. Rest can be minimal (icons, simple illustrations) so the product is the hero.
- **Feeling it should create:** “This is a real product; my statements and payouts are in good hands.”
- **Best serves:** Mixed audience (Felicia + future teams); resellers who want “serious tool” vibes; easier to extend to more product-led pages later.

---

### Concept C: Live & social energy

- **Visual personality:** Energetic, “where the action is.” Live sales and community feel; bold but still readable. Boutique + social, not generic growth hack.
- **Palette direction:** Light or dark hero option. One vivid accent (coral, electric blue, or green) for CTAs and highlights. Strong contrast; optional gradient or texture in hero only. Rest of page can calm down so it doesn’t overwhelm.
- **Typography feel:** Bold sans for hero (e.g. font-semibold or font-bold). One display touch for “Live” or “Fabulous finds” if it fits. Body stays clean and legible.
- **Button/card style:** Rounded or pill for primary CTA. Cards: clear borders or light shadows; optional hover lift. Links and CTAs feel obviously clickable.
- **Imagery/media guidance:** Hero: strong live or social moment (Whatnot/Instagram vibe, or racks in motion). “Next live” or “Follow to get notified” block with platform icon. Product screenshot can be smaller or in a card so energy stays on “live” and “finds.”
- **Feeling it should create:** “Something’s happening here; I want to join the next live and see what’s new.”
- **Best serves:** Shoppers and followers who discover via social; homepage as funnel to live and Whatnot first; resellers who like “community” and energy.

---

## 4. Media & content checklist for Figma

Gather or plan these so mockups are realistic and on-brand.

### Product & workspace

- [ ] **Dashboard or overview screenshot** (admin workspace) — for “product preview” or “see your numbers.” Sanitize if needed; can blur sensitive data.
- [ ] **Portal or statement screenshot** (reseller view) — for “clear payouts & statements” or trust block. One clean frame is enough.
- [ ] **Whatnot receipt or payout screenshot** (optional) — for trust/receipts section. Blur amounts if used in public mockups.

### Live & shop

- [ ] **Whatnot live or Instagram Live still** — hero or “live & drops” section. Prefer good lighting and clear “live” context.
- [ ] **Racks / inventory / product flat lay** — hero or about. Fits “fabulous finds” and boutique.
- [ ] **One “next live” or “follow for schedule” line** — replace “As the shop grows…” in copy; can be “Follow on Whatnot for live schedule” until dates are real.

### Brand & person

- [ ] **Logo lockup** — full logo (e.g. fefe-ave-logo.png) for hero or header in Figma.
- [ ] **Bird icon** — fefe-bird-icon.png for favicon, small UI, or social.
- [ ] **Felicia or shop photo** (optional) — for about section if desired. Natural, warm tone.

### Copy to finalize before or during Figma

- [ ] Hero supporting line (one sentence after headline).
- [ ] Primary CTA label (“Join a live on Whatnot” / “Shop on Whatnot” / “Follow for schedule”).
- [ ] Product preview headline + 1–2 benefit lines.
- [ ] “How it works” three steps (short).
- [ ] Live & drops: replace placeholder third bullet with concrete line or “Follow on Whatnot for schedule.”
- [ ] Trust block: one headline + one line (e.g. “Real receipts. Clear payouts. No guesswork.”).

---

## 5. Recommendation: which concept to prototype first

**Prototype Concept A (Warm premium reseller) first.**

- Aligns with the chosen direction: **Warm / Live / boutique** for the public site.
- Fits the real audience: resellers and wholesale partners who care about trust and clarity, plus shoppers who want a human, small-shop feel.
- Live and product value stay in the section order above; the visual tone (warm, premium, human) is what Concept A explores.
- After one full homepage in Concept A, you can cherry-pick from B (e.g. product screenshot treatment) or C (e.g. one bolder hero CTA) without redoing structure.

**Next steps:** In Figma, build one full homepage using the recommended section order and Concept A. Use the media checklist to place real or placeholder assets. Then run a quick pass with Concept B and C on hero + one section each to compare tone; choose or blend before implementing in code.
