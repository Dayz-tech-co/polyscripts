# UI Setup — PolyScripts (Polymarket-mature)

Design rules for a flat, adult trading-analytics UI. Inspired by Polymarket’s public product chrome and sober dark market tools — **not** generic “AI SaaS” aesthetics.

## Principles

1. **Flat surfaces only** — no decorative gradients on panels, heroes, buttons, or brand chrome. Loading skeletons may use a single flat opacity pulse.
2. **One accent** — Polymarket blue `#2E5CFF` for active controls, links, focus, and brand moments.
3. **Yes / No money colors** — green `#16C784`, red `#EA3943`. Use only for PnL / outcomes, never for decoration.
4. **Hierarchy by type & weight**, not glow, shadows, or rainbow fills.
5. **Missing data = `N/A`** — never `--`, never invent `0`.
6. **Icons** — Lucide, 14–16px, `strokeWidth={1.75}` (or default), muted gray; no emoji; no oversized icon wells.
7. **Corners** — 8px default, 10px cards. Avoid pill overload; pills only for toggles/ranks.
8. **Shadows** — none on default cards; optional single soft shadow on floating popovers only.
9. **Copy** — short, factual, product-first. Brand name is the home hero signal.

## Surfaces

| Token | Hex | Use |
|-------|-----|-----|
| `--bg-app` | `#0b0e14` | Page |
| `--bg-secondary` | `#10141c` | Strips |
| `--bg-card` | `#12171f` | Panels |
| `--bg-card-elevated` | `#171c26` | Nested / active cell |
| `--border-default` | `rgba(255,255,255,0.08)` | Hairlines |

## Type

- Sans: system / Inter stack (already loaded).
- Labels: 10–11px, uppercase, tracked, muted.
- Values: tabular nums, medium–bold, high contrast.

## Components

- **Header** — flat bar, hairline bottom, wordmark + text nav, compact search.
- **Home** — brand + one line + search; then ranked lists. No capability marketing grid.
- **KPI** — one hero metric (flat tinted panel + left accent bar), featured pair, quiet secondary row.
- **Charts** — flat framed plot; semantic line color only; draw-in OK if `prefers-reduced-motion` respected.
- **Empty / loading** — `N/A`, skeletons that match live layout.

## Do not

- Orange→pink brand gradients, purple glow themes, cream/serif newspaper looks.
- Multi-layer shadows, glassmorphism, badge sticker spam on heroes.
- Duplicate the same KPI under the chart and in the strip.
- Fake data or decorative charts.

## Env / code map

- Tokens & layout: `src/styles.css` (`:root`)
- Home: `src/pages/HomePage.jsx`
- Profile KPIs: `src/components/ProfileStats.jsx`
- Formatters (N/A): `src/utils/formatters.js`

When adding UI, match existing flat panels first; do not introduce a new accent color.
