# PolyScripts

Public profile and portfolio analytics page for **PolyScripts** — Polymarket
bots, strategies and education. Built as the pre-login, publicly viewable
profile experience: wallet identity, portfolio performance, open positions,
resolved history and recent activity.

## Stack

- React + Vite
- Plain CSS (custom property design system, no CSS framework)
- [lucide-react](https://lucide.dev/) for icons
- No authentication, wallet connection, or backend — all data is local mock
  data served through a small async service layer

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Project structure

```
src/
  components/     UI components (header, profile, stats, chart, tables, ...)
  data/           Central mock data (profile, stats, positions, activity)
  services/       Async service layer wrapping the mock data
  utils/          Formatting helpers (currency, percentage, address, time)
  context/        Toast notification context
  styles.css      Design tokens + all application styles
```

## Notes

The wallet address, positions and activity shown are demonstration data for
UI purposes only.
