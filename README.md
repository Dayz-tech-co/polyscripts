# PolyScripts

**Polymarket Bots, Strategies & Education.**

A public account search and analytics explorer for Polymarket. Visitors
search for any public account by username or wallet address, pick it from
an autocomplete dropdown, and land on a dynamic, read only profile with its
public statistics, positions, activity and trading volume over time.

This is a research and analytics interface only. There is no trading,
depositing, order placement, wallet connection, login or signup anywhere in
the app.

## Main flow

```
Search a username or address
        ↓
Pick an account from the dropdown
        ↓
/profile/:identifier loads that account's public data
        ↓
Overview, Positions, Activity and History tabs
```

## Data sources

All account data comes from Polymarket's public, unauthenticated, CORS-open
endpoints (see `src/services/providers/livePolymarketProvider.js`):

- `gamma-api.polymarket.com/public-search` - account search/autocomplete
- `gamma-api.polymarket.com/public-profile` - profile lookup by address
- `data-api.polymarket.com/v1/leaderboard` - ranked accounts (Explore page,
  Top Accounts, per-account rank)
- `data-api.polymarket.com/positions` - open positions
- `data-api.polymarket.com/closed-positions` - resolved positions / history
- `data-api.polymarket.com/activity` - trade/redeem activity feed
- `data-api.polymarket.com/value` - current total position value
- `data-api.polymarket.com/traded` - count of markets traded

Nothing here claims a metric it can't back up: fields that aren't available
from these endpoints (like a true historical portfolio balance) are simply
left out or, in the case of the performance chart, reframed as what can
genuinely be derived (cumulative trading volume from the real activity
feed) instead of invented.

A `mockPolymarketProvider` implementing the exact same function signatures
is also included for offline development. Switch to it with:

```bash
VITE_DATA_PROVIDER=mock npm run dev
```

## Stack

- React + Vite
- React Router
- Plain CSS (custom property design system, no CSS framework)
- [lucide-react](https://lucide.dev/) for icons

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
  components/     UI components (search, profile, stats, chart, tables, ...)
  pages/          Route-level pages (Home, Profile, Leaderboard, Search, 404)
  services/       Account discovery + profile data service layer
  services/providers/  Live (real API) and mock data providers
  adapters/       Normalizes raw API records into internal shapes
  hooks/          useAccountSearch, useProfile
  utils/          Address, avatar, formatting and recent-search helpers
  context/        Toast notification context
  styles.css      Design tokens + all application styles
```
