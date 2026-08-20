# Polymarket Wallet Data Sources

Guide for rebuilding a Betmoar-style portfolio reader: given a **Polygon wallet / Polymarket proxy address**, fetch profile, positions, full trade history, PnL charts, deposits/withdrawals, and cash balance.

This matches how `polymarket-fork` (and sites like [betmoar.fun](https://betmoar.fun)) read public data. **No Polymarket login is required** for these GETs.

---

## Architecture overview

```
wallet address (0x…)
    │
    ├─► gamma-api.polymarket.com     → profile, avatar, bio, events
    ├─► data-api.polymarket.com      → positions, activity, closed, traded, leaderboard, value
    ├─► user-pnl-api.polymarket.com  → PnL time series (chart)
    ├─► lb-api.polymarket.com        → profit window amounts
    ├─► api.relay.link               → cross-chain deposit/withdraw requests
    ├─► bridge.polymarket.com        → Polymarket bridge deposits
    └─► Polygon RPC (viem)           → on-chain USDC / USDC.e / pUSD balances
```

**Input:** lowercase or checksummed `0x` + 40 hex chars (Polymarket proxy wallet).

**Code in this repo:**
- Clients: `src/lib/polymarket/client.ts`
- Config / base URLs: `src/lib/polymarket/config.ts`
- Fetchers: `src/lib/polymarket/endpoints.ts`, `balance.ts`, `funding.ts`, `pnl.ts`
- React Query hooks: `src/features/polymarket/hooks/use-polymarket-data.ts`

---

## Base URLs

| Name | Default URL | Env override |
|------|-------------|--------------|
| Gamma | `https://gamma-api.polymarket.com` | `VITE_GAMMA_API_URL` |
| Data API | `https://data-api.polymarket.com` | `VITE_DATA_API_URL` |
| User PnL | `https://user-pnl-api.polymarket.com` | `VITE_USER_PNL_API_URL` |
| Leaderboard / profit | `https://lb-api.polymarket.com` | `VITE_LB_API_URL` |
| Relay | `https://api.relay.link` | `VITE_RELAY_API_URL` |
| Bridge | `https://bridge.polymarket.com` | `VITE_BRIDGE_API_URL` |
| CLOB | `https://clob.polymarket.com` | `VITE_CLOB_API_URL` |
| Polygon RPC | `https://polygon-bor-rpc.publicnode.com` | `VITE_POLYGON_RPC_URL` |

---

## 1. Public profile (avatar, bio, username metadata)

```
GET https://gamma-api.polymarket.com/public-profile?address={WALLET}
```

**Returns (subset):** `name`, `bio`, `profileImage`, `proxyWallet`, `xUsername`, `createdAt`, `verifiedBadge`, `takerTier`, `takerTierName`, …

**Notes:** Returns `null` / error if address has no profile. Username can also be taken from leaderboard (`userName`) or latest activity (`name` / `pseudonym`).

---

## 2. Open positions

```
GET https://data-api.polymarket.com/positions
  ?user={WALLET}
  &sizeThreshold=0.1
  &limit=100
  &offset=0
  &sortBy=CURRENT
  &sortDirection=DESC
```

**Useful `sortBy` values:** `CURRENT`, `INITIAL`, `TOKENS`, `CASHPNL`, `PERCENTPNL`, `TITLE`, `PRICE`, `AVGPRICE`

**Fields (subset):** `title`, `outcome`, `size`, `avgPrice`, `curPrice`, `initialValue`, `currentValue`, `cashPnl`, `percentPnl`, `redeemable`, `conditionId`, `asset`, `icon`, `slug`, `eventSlug`

**Active positions (UI):** keep rows where `size > 0.1 && currentValue > 0 && !redeemable`.

**Redeemable wins:** `redeemable && size > 0.1 && currentValue > 0` (lost markets can be `redeemable` with `currentValue === 0` — ignore those for “You won $X”).

**Pagination:** increase `offset` by `limit` until a page returns fewer than `limit` items.

---

## 3. Positions value

### A) Official value endpoint

```
GET https://data-api.polymarket.com/value?user={WALLET}
```

Response: `[{ "user": "0x…", "value": number }]` — use `data[0].value`.

### B) What this app uses for “positions value”

Sum `currentValue` of **active** open positions (see filter above). Function: `fetchActivePositionsValue`.

**Portfolio total (Betmoar-style):**

```
portfolioTotal = activePositionsValue + cashBalance
```

---

## 4. Closed positions

```
GET https://data-api.polymarket.com/closed-positions
  ?user={WALLET}
  &limit=50
  &offset=0
  &sortBy=TIMESTAMP
  &sortDirection=DESC
```

**Biggest win:**

```
GET .../closed-positions?user={WALLET}&limit=1&sortBy=REALIZEDPNL&sortDirection=DESC
```

Use `realizedPnl` on the first row.

Paginate with `offset` the same way as positions for full closed history.

---

## 5. Activity / full trade history (Betmoar-style)

### Single page

```
GET https://data-api.polymarket.com/activity
  ?user={WALLET}
  &limit=100
  &offset=0
  &sortBy=TIMESTAMP
  &sortDirection=DESC
```

### Optional type filter

```
&type=TRADE|SPLIT|MERGE|REDEEM|REWARD|CONVERSION|DEPOSIT|WITHDRAWAL|YIELD|MAKER_REBATE|TAKER_REBATE|REFERRAL_REWARD
```

### Critical: deposits & withdrawals

Data API **hides** deposit/withdrawal rows unless you pass:

```
&excludeDepositsWithdrawals=false
```

Even `type=WITHDRAWAL` returns empty without that flag.

### How to get *whole* history (like Betmoar)

1. **Paginate the general feed**
   - `limit=100`, `offset=0,100,200,…`
   - Stop when `batch.length < limit` or after a max page cap (this repo: **15 pages** → up to ~1500 rows).
2. **Also fetch sparse / funding types separately** (they can be missing from the first pages of the mixed feed):
   - For each of: `MAKER_REBATE`, `TAKER_REBATE`, `REFERRAL_REWARD`, `REWARD`, `DEPOSIT`, `WITHDRAWAL`
   - Paginate with `type=…` (+ `excludeDepositsWithdrawals=false` for deposit/withdrawal)
   - This repo: up to **5 pages** for rewards, **20 pages** for deposit/withdrawal.
3. **Dedupe** by something like:
   ```
   `${txHash}:${timestamp}:${type}:${conditionId}:${usdcSize}`
   ```
4. **Sort** by `timestamp` descending.

Implemented as `fetchFullActivity` in `endpoints.ts`.

### Activity row shape (subset)

| Field | Meaning |
|-------|---------|
| `type` | `TRADE`, `REDEEM`, `DEPOSIT`, `WITHDRAWAL`, … |
| `side` | `BUY` / `SELL` (trades) |
| `usdcSize` | USD notional |
| `size` | shares |
| `price` | 0–1 probability price |
| `title`, `outcome`, `icon` | market display |
| `timestamp` | unix **seconds** |
| `transactionHash` | tx id |

**UI labels:**
- Buy = `type===TRADE && side===BUY` → value `-usdcSize`
- Sell = `type===TRADE && side===SELL` → value `+usdcSize`
- Withdraw = `type===WITHDRAWAL` → value `-usdcSize`
- Deposit = `type===DEPOSIT` → value `+usdcSize`

---

## 6. Traded count

```
GET https://data-api.polymarket.com/traded?user={WALLET}
```

Response: `{ "user": "0x…", "traded": number }`.

---

## 7. Leaderboard PnL

```
GET https://data-api.polymarket.com/v1/leaderboard
  ?user={WALLET}
  &timePeriod=DAY|WEEK|MONTH|ALL
  &category=OVERALL
```

Response: array; use `data[0]` → `pnl`, `vol`, `userName`, `profileImage`, …

Also usable with `userName={username}` instead of `user`.

---

## 8. PnL chart series (full curve)

```
GET https://user-pnl-api.polymarket.com/user-pnl
  ?user_address={WALLET_LOWERCASE}
  &interval=1d|1w|1m|max|all
  &fidelity=1h|3h|12h|1d
```

Optional: `&market_type=perps` for perps (predictions omit this).

**Suggested period → params (this app):**

| UI period | `interval` | `fidelity` |
|-----------|------------|------------|
| 1D | `1d` | `1h` |
| 1W | `1w` | `3h` |
| 1M | `1m` | `12h` |
| 1Y / YTD / ALL | `max` | `1d` |

**Point shape:** `{ t: unixSeconds, p: cumulativePnlNumber }`

**Chart transform (Betmoar-like relative window):**
1. Sort by `t`.
2. For non-`ALL`, baseline = first point in window (or last point before window for `1Y`).
3. Display `value = p - baseline`; headline PnL = last − baseline.
4. For `ALL`, headline = last `p` (lifetime cumulative).

See `transformUserPnlSeries` in `pnl.ts`.

---

## 9. Profit window amount (summary “+$X past day”)

```
GET https://lb-api.polymarket.com/profit
  ?address={WALLET_LOWERCASE}
  &window=1d|7d|30d|all
  &limit=1
```

Use `data[0].amount`.

**Fallback chain used in portfolio summary:**
1. `fetchUserProfit(address, '1d')`
2. else leaderboard `DAY` `pnl`
3. else last-day series PnL from user-pnl-api

```
dailyPnlPercent = dailyPnl / |portfolioTotal - dailyPnl| * 100
```

---

## 10. Cash balance (Available to trade)

Not from Polymarket HTTP — **Polygon ERC-20 `balanceOf`**.

| Token | Contract |
|-------|----------|
| pUSD | `0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB` |
| USDC.e | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` |
| native USDC | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |

- Decimals: **6**
- Sum all three settled balances = cash available
- RPC: Polygon public nodes / Alchemy (`VITE_POLYGON_RPC_URL`)

Code: `src/lib/polymarket/balance.ts` (`fetchCashBalance`).

---

## 11. Deposits & withdrawals (complete funding history)

Betmoar shows full deposit/withdraw lists. This app merges three sources then dedupes.

### A) Data API (primary)

```
GET https://data-api.polymarket.com/activity
  ?user={WALLET}
  &type=DEPOSIT          # or WITHDRAWAL
  &limit=100
  &offset=0
  &excludeDepositsWithdrawals=false
```

Paginate until empty (this repo: up to 20 pages × 100).

### B) Relay (cross-chain)

```
GET https://api.relay.link/requests/v2?user={WALLET_LOWERCASE}&limit=50
```

Paginate with `continuation` from the response until absent (this repo: max 20 pages).

Map successful requests → synthetic `DEPOSIT` / `WITHDRAWAL` activity rows. Skip if either source or destination tx hash already appears in data-api/bridge rows (same transfer, two hashes).

### C) Polymarket bridge

```
POST/GET https://bridge.polymarket.com/deposit   # resolve bridge address for wallet
GET https://bridge.polymarket.com/status/{bridgeAddress}
```

### D) Optional reconciliation

If indexed deposits still under-explain buys − sells − redeems − cash, the app can invent a synthetic deposit gap (`fetchReconciledDeposits` in `funding.ts`). Use carefully; prefer indexed sources first.

**Merge:** `dedupeActivities([...dataApi, ...relay, ...bridge, ...reconciled])` then sort by timestamp desc.

---

## 12. Portfolio summary recipe (one wallet)

```text
parallel:
  positionsValue = sum(active open positions.currentValue)
  cashBalance    = sum(pUSD + USDC.e + USDC on Polygon)
  dailyProfit    = lb-api /profit?window=1d  (fallback leaderboard DAY / pnl series)
  username       = leaderboard ALL userName | activity name | 0x short
  daySeries      = user-pnl-api interval=1d fidelity=1h

portfolioTotal = positionsValue + cashBalance
dailyPnlPercent = dailyPnl / |portfolioTotal - dailyPnl| * 100
```

---

## 13. Example curl commands

Replace `WALLET` with the address.

```bash
# Profile
curl "https://gamma-api.polymarket.com/public-profile?address=WALLET"

# Positions
curl "https://data-api.polymarket.com/positions?user=WALLET&sizeThreshold=0.1&limit=100"

# Activity page 0
curl "https://data-api.polymarket.com/activity?user=WALLET&limit=100&offset=0&sortBy=TIMESTAMP&sortDirection=DESC"

# Withdrawals (must include exclude flag)
curl "https://data-api.polymarket.com/activity?user=WALLET&type=WITHDRAWAL&limit=100&excludeDepositsWithdrawals=false"

# PnL chart (1 day)
curl "https://user-pnl-api.polymarket.com/user-pnl?user_address=WALLET&interval=1d&fidelity=1h"

# Profit 1d
curl "https://lb-api.polymarket.com/profit?address=WALLET&window=1d&limit=1"

# Leaderboard
curl "https://data-api.polymarket.com/v1/leaderboard?user=WALLET&timePeriod=ALL&category=OVERALL"

# Traded count
curl "https://data-api.polymarket.com/traded?user=WALLET"

# Relay funding
curl "https://api.relay.link/requests/v2?user=WALLET&limit=50"
```

Use lowercase address for `user_address` / Relay `user` / lb `address` where noted.

---

## 14. Rate limits & practical tips

- Prefer **parallel** `Promise.all` for summary cards; paginate history in the background.
- Cap pages (heavy traders have 1000+ activity rows and 100+ withdrawals).
- Always dedupe after merging supplemental type feeds + Relay.
- Timestamps from data-api activity are **unix seconds**; user-pnl `t` is also seconds (multiply by 1000 for JS `Date`).
- CORS: browser apps may need a proxy; server-side / Node scripts can call APIs directly.
- Perps portfolio APIs are separate / incomplete in this fork (UI stubs with zeros). Predictions data above is the real path Betmoar-style tools use.

---

## 15. Minimal TypeScript skeleton

```ts
const DATA = 'https://data-api.polymarket.com'
const GAMMA = 'https://gamma-api.polymarket.com'
const PNL = 'https://user-pnl-api.polymarket.com'
const LB = 'https://lb-api.polymarket.com'

async function getJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

export async function loadWalletBundle(wallet: string) {
  const user = wallet.toLowerCase()

  const [profile, positions, traded, leaderboard, pnlSeries, profit1d] =
    await Promise.all([
      getJson(`${GAMMA}/public-profile?address=${wallet}`).catch(() => null),
      getJson(`${DATA}/positions?user=${wallet}&sizeThreshold=0.1&limit=100`),
      getJson(`${DATA}/traded?user=${wallet}`),
      getJson(`${DATA}/v1/leaderboard?user=${wallet}&timePeriod=DAY&category=OVERALL`),
      getJson(`${PNL}/user-pnl?user_address=${user}&interval=1d&fidelity=1h`),
      getJson(`${LB}/profit?address=${user}&window=1d&limit=1`),
    ])

  // Full history: loop offset += 100 until short page; also fetch type=DEPOSIT|WITHDRAWAL
  // with excludeDepositsWithdrawals=false. Then fetch cash via Polygon balanceOf.

  return { profile, positions, traded, leaderboard, pnlSeries, profit1d }
}
```

---

## 16. File map in this repo

| Concern | File |
|---------|------|
| Base URLs + wallet env | `src/lib/polymarket/config.ts` |
| Axios clients | `src/lib/polymarket/client.ts` |
| Profile, positions, activity, PnL, leaderboard | `src/lib/polymarket/endpoints.ts` |
| Full activity pagination + supplemental types | `fetchFullActivity` in `endpoints.ts` |
| Cash on Polygon | `src/lib/polymarket/balance.ts` |
| Deposits/withdrawals merge | `src/lib/polymarket/funding.ts` |
| PnL interval/fidelity + chart math | `src/lib/polymarket/pnl.ts` |
| Types | `src/lib/polymarket/types.ts` |
| React Query wiring | `src/features/polymarket/hooks/use-polymarket-data.ts` |

---

## Summary for another AI

To clone Betmoar given only a wallet:

1. Read **profile** from Gamma `public-profile`.
2. Read **positions / closed / traded / leaderboard / value** from Data API with `user=`.
3. Build **full trade history** by paginating Data API `activity`, plus per-type pages for rebates and funding (`excludeDepositsWithdrawals=false`).
4. Build **PnL charts** from User PnL API `/user-pnl` (`user_address`, `interval`, `fidelity`); rebase series for period windows.
5. Read **daily profit** from lb-api `/profit`.
6. Read **cash** from Polygon ERC20 balances (pUSD + USDC.e + USDC).
7. Enrich **deposits/withdrawals** with Relay + Bridge, then dedupe against Data API.

No auth headers are required for these public reads.
