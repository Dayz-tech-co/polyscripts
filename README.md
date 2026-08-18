# PolyScripts

**Polymarket Bots, Strategies & Education.**

A public market analytics ecosystem for Polymarket: Explore, Leaderboard,
Dashboard, Compare, Tools, Ecosystem and per-account profiles with public
statistics, positions, activity and trading volume over time.

This is a research and analytics interface only. There is no trading,
depositing, order placement, wallet connection, login or signup anywhere in
the app.

## Pages

- **Explore** (`/`) - hero search, recently viewed accounts, top accounts and
  trending accounts
- **Profile** (`/profile/:identifier`) - Overview, Positions, Activity and
  History tabs for any username or wallet address
- **Leaderboard** (`/leaderboard`) - ranked accounts, sortable by PnL, volume
  and win rate across Day / Week / Month / All Time
- **Dashboard** (`/dashboard`) - ecosystem stats, activity trend, performance
  distribution, top movers, recent activity and category breakdown
- **Tools** (`/tools`) - account checker and compare tool
- **Account Checker** (`/checker`) - quick PnL / volume / win-rate lookup by
  username or address
- **Compare** (`/compare`) - side-by-side account comparison with performance
  series charts
- **Ecosystem** (`/ecosystem`) - public data resources for building on top of
  Polymarket

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

### Live mode (production default)

Production builds resolve accounts directly through Polymarket's public,
unauthenticated, CORS-open endpoints (see
`src/services/providers/livePolymarketProvider.js`). A full wallet address
is looked up on its own - search, leaderboard and any local data are only
discovery aids, never the source of truth for whether an address exists. An
address with no profile metadata but real public analytics still renders,
identified by its shortened address. "Account not found" is shown only when
the direct lookups conclusively return no usable public data.

- `gamma-api.polymarket.com/public-search` - account search/autocomplete
- `gamma-api.polymarket.com/public-profile` - profile lookup by address
- `data-api.polymarket.com/v1/leaderboard` - ranked accounts (Explore page,
  Top Accounts, per-account rank)
- `data-api.polymarket.com/positions` - open positions
- `data-api.polymarket.com/closed-positions` - resolved positions / history
- `data-api.polymarket.com/activity` - trade/redeem activity feed
- `data-api.polymarket.com/value` - current total position value
- `data-api.polymarket.com/traded` - count of markets traded

Switch the provider with:

```bash
VITE_DATA_PROVIDER=live npm run dev
```

### Mock mode (development fallback)

The `mock` provider is only used for offline development (an explicit
`VITE_DATA_PROVIDER=mock` wins in any environment). It is backed by
`src/providers/demoProvider.js` - a
single source of truth for a deterministic roster of demo accounts (canonical
PnL, volume, win rate, portfolio value, open positions) plus market titles,
category breakdowns and ecosystem resources. Because every page reads from
this one provider, the same numbers always agree across a profile, the
leaderboard, the dashboard and the compare tool. No network requests are made
in mock mode. Mock data never gates account resolution - the same direct
lookup semantics apply, with addresses outside the roster resolving to
"Account not found" only after no usable data is found.

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
  providers/      demoProvider.js - single source of truth for demo data
  components/     UI components (search, profile, stats, chart, tables, ...)
  pages/          Route-level pages (Explore, Profile, Leaderboard, Dashboard,
                  Tools, Checker, Compare, Ecosystem, Search, 404)
  services/       Account discovery + profile data service layer
  services/providers/  Live (real API) and mock data providers
  services/       ecosystemService.js - cached dashboard/leaderboard queries
  adapters/       Normalizes raw API records into internal shapes
  hooks/          useAccountSearch, useProfile
  utils/          Address, avatar, formatting and recent-search helpers
  context/        Toast notification context
  styles.css      Design tokens + all application styles
```