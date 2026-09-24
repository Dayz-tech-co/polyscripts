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
- **Markets** (`/markets`) - every active market sorted by 24h volume,
  biggest movers, liquidity, ending soon or rewards, with search
- **Market** (`/market/:slug`) - live odds, price history, top holders per
  outcome with a smart-money lean, recent trades and reward terms
- **Whale Tracker** (`/whales`) - live large-trade feed with fresh-wallet,
  long-shot, mega-trade and insider signals, plus browser alerts
- **Arbitrage Scanner** (`/arbitrage`) - multi-outcome events whose YES
  prices sum away from $1 (buy-all or sell-all baskets), rescanned every 30s
- **Command palette** - press Ctrl/⌘+K or `/` anywhere to jump to any page,
  trader or market
- **Watchlist feed** (`/watchlist`) - one timeline of trades from followed
  wallets, with browser alerts while the tab is open
- **Profile** (`/profile/:identifier`) - Smart Score, behaviour badges, edge
  by category, then Overview, Positions, Activity and History tabs for any
  username or wallet address
- **Leaderboard** (`/leaderboard`) - ranked accounts by PnL or volume across
  Day / Week / Month / All Time, overall or per category (Politics, Sports,
  Crypto, ...)
- **Dashboard** (`/dashboard`) - live market pulse: 24h volume, liquidity,
  whale flow, biggest movers, volume by category and top weekly traders
- **Rewards** (`/rewards`) - public reward/rebate activity for a clearly
  labelled leaderboard sample and a customizable trader share-card studio
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
- `data-api.polymarket.com/trades` - public trade tape (whale feed, market trades)
- `data-api.polymarket.com/holders` - top holders per market outcome
- `gamma-api.polymarket.com/markets` - active markets, odds and rewards config
- `clob.polymarket.com/prices-history` - outcome price history
- `clob.polymarket.com/rewards/markets/current` - reward programs (paginated
  server-side by `api/rewards.js`)

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
