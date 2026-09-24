// Market-wide analytics: the live whale tape, market lists, market detail
// (price history, holders, smart-money lean) and the market pulse used by
// the dashboard. Everything resolves through the active provider and is
// normalized here so pages never touch raw API shapes.
//
// Signals (fresh wallet, long shot, insider) are transparent heuristics over
// public data, not claims about any person. The UI labels them that way.

import { provider } from "./providers";
import { cacheGet, cacheSet } from "./cache";
import { classifyMarket } from "../utils/traderInsights";

const LIST_TTL = 30_000;
const WALLET_TTL = 10 * 60_000;

async function cached(key, ttl, producer) {
  const hit = cacheGet(key);
  if (hit !== undefined) return hit;
  const value = await producer();
  cacheSet(key, value, ttl);
  return value;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

export function normalizeMarket(raw) {
  if (!raw) return null;
  const names = parseJsonArray(raw.outcomes);
  const prices = parseJsonArray(raw.outcomePrices);
  const tokens = parseJsonArray(raw.clobTokenIds);
  const event = Array.isArray(raw.events) ? raw.events[0] : null;
  const rewards = Array.isArray(raw.clobRewards) ? raw.clobRewards : [];
  const dailyRewards = rewards.reduce((sum, r) => sum + (num(r.rewardsDailyRate) || 0), 0);
  return {
    id: raw.id ?? raw.conditionId,
    conditionId: raw.conditionId ?? null,
    slug: raw.slug ?? null,
    question: raw.question || raw.title || "Untitled market",
    groupTitle: raw.groupItemTitle || null,
    eventSlug: event?.slug ?? null,
    eventTitle: event?.title ?? null,
    eventId: event?.id ?? null,
    negRisk: Boolean(raw.negRisk),
    icon: raw.icon || raw.image || event?.icon || null,
    description: raw.description || "",
    outcomes: names.map((name, i) => ({ name, price: num(prices[i]), tokenId: tokens[i] ?? null, index: i })),
    volume24h: num(raw.volume24hr),
    volume1w: num(raw.volume1wk),
    volume: num(raw.volumeNum ?? raw.volume),
    liquidity: num(raw.liquidityNum ?? raw.liquidity),
    change1h: num(raw.oneHourPriceChange),
    change1d: num(raw.oneDayPriceChange),
    change1w: num(raw.oneWeekPriceChange),
    lastPrice: num(raw.lastTradePrice),
    bestBid: num(raw.bestBid),
    bestAsk: num(raw.bestAsk),
    spread: num(raw.spread),
    startDate: raw.startDate ?? null,
    endDate: raw.endDate ?? null,
    closed: Boolean(raw.closed),
    active: raw.active !== false,
    rewardsDaily: dailyRewards > 0 ? dailyRewards : null,
    rewardsMinSize: num(raw.rewardsMinSize),
    rewardsMaxSpread: num(raw.rewardsMaxSpread),
    resolutionSource: raw.resolutionSource || null,
  };
}

export function normalizeTrade(raw) {
  const price = num(raw.price);
  const shares = num(raw.size);
  const notional = price != null && shares != null ? price * shares : null;
  return {
    id: `${raw.transactionHash || "tx"}-${raw.asset || ""}-${raw.side || ""}-${raw.timestamp || ""}-${raw.proxyWallet || ""}`,
    wallet: raw.proxyWallet ?? null,
    account: {
      address: raw.proxyWallet ?? null,
      username: raw.name || null,
      displayName: raw.pseudonym || null,
      avatar: raw.profileImageOptimized || raw.profileImage || null,
    },
    side: raw.side || null,
    outcome: raw.outcome || null,
    outcomeIndex: raw.outcomeIndex ?? null,
    price,
    shares,
    notional,
    timestamp: raw.timestamp ? raw.timestamp * 1000 : null,
    title: raw.title || "Unknown market",
    slug: raw.slug ?? null,
    eventSlug: raw.eventSlug ?? null,
    icon: raw.icon ?? null,
    conditionId: raw.conditionId ?? null,
    txHash: raw.transactionHash ?? null,
  };
}

// ---------------------------------------------------------------------------
// Wallet context + trade signals
// ---------------------------------------------------------------------------

/** Lifetime markets traded for a wallet (cached; null when unknown). */
export async function getWalletMarketsTraded(address, { signal } = {}) {
  if (!address) return null;
  return cached(`wallet:traded:${address.toLowerCase()}`, WALLET_TTL, async () => {
    try {
      return await provider.getTraded(address, { signal });
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      return null;
    }
  });
}

/** All-time leaderboard PnL / volume / rank for a wallet (cached). */
export async function getWalletAllTime(address, { signal } = {}) {
  if (!address) return null;
  return cached(`wallet:alltime:${address.toLowerCase()}`, WALLET_TTL, async () => {
    try {
      const rows = await provider.getLeaderboard({ timePeriod: "ALL", orderBy: "PNL", user: address, limit: 1, signal });
      const row = rows?.[0];
      if (!row) return null;
      return { pnl: num(row.pnl), volume: num(row.vol), rank: num(row.rank) };
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      return null;
    }
  });
}

export const SIGNALS = {
  insider: { label: "Insider signal", tone: "danger", hint: "Fresh wallet placing a large buy on a low-probability outcome." },
  fresh: { label: "Fresh wallet", tone: "warn", hint: "Wallet has traded 5 or fewer markets in total." },
  longshot: { label: "Long shot", tone: "info", hint: "Buying an outcome priced at 15¢ or less." },
  mega: { label: "Mega trade", tone: "brand", hint: "Single trade of $50K or more." },
};

export function tradeSignals(trade, marketsTraded) {
  const out = [];
  const fresh = marketsTraded != null && marketsTraded <= 5;
  const buying = trade.side === "BUY";
  if (fresh && buying && (trade.notional ?? 0) >= 5_000 && (trade.price ?? 1) <= 0.35) out.push("insider");
  if (fresh) out.push("fresh");
  if (buying && trade.price != null && trade.price <= 0.15) out.push("longshot");
  if ((trade.notional ?? 0) >= 50_000) out.push("mega");
  return out;
}

/** Attaches wallet context + signals to trades, looking up at most `maxWallets` wallets. */
export async function enrichTrades(trades, { maxWallets = 30, signal } = {}) {
  const wallets = [...new Set(trades.map((t) => t.wallet).filter(Boolean))].slice(0, maxWallets);
  const traded = new Map();
  await Promise.all(
    wallets.map(async (w) => {
      traded.set(w, await getWalletMarketsTraded(w, { signal }).catch(() => null));
    }),
  );
  return trades.map((t) => {
    const marketsTraded = traded.has(t.wallet) ? traded.get(t.wallet) : null;
    return { ...t, marketsTraded, signals: tradeSignals(t, marketsTraded) };
  });
}

// ---------------------------------------------------------------------------
// Whale tape
// ---------------------------------------------------------------------------

export async function getWhaleTrades({ minCash = 10_000, side, limit = 100, market, user, enrich = true, signal } = {}) {
  const raw = await provider.getTrades({ minCash, side, limit, market, user, signal });
  const trades = raw.map(normalizeTrade);
  return enrich ? enrichTrades(trades, { signal }) : trades;
}

/** Recent trades for a set of wallets (watchlist feed), newest first. */
export async function getWalletsTrades(addresses, { perWallet = 15, signal } = {}) {
  const batches = await Promise.all(
    addresses.map((user) =>
      provider.getTrades({ user, limit: perWallet, signal }).catch((err) => {
        if (err?.name === "AbortError") throw err;
        return [];
      }),
    ),
  );
  const seen = new Set();
  return batches
    .flat()
    .map(normalizeTrade)
    .filter((t) => (seen.has(t.id) ? false : seen.add(t.id)))
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
}

// ---------------------------------------------------------------------------
// Market lists
// ---------------------------------------------------------------------------

export const MARKET_SORTS = {
  volume: { label: "24h volume" },
  movers: { label: "Biggest movers" },
  liquidity: { label: "Liquidity" },
  ending: { label: "Ending soon" },
  rewards: { label: "Rewards" },
};

/** Still contested: leading price not yet pinned to 0 or 1 (finished games move ~100¢ and swamp movers). */
function isLive(m) {
  const p = m.outcomes[0]?.price;
  return p != null && p > 0.03 && p < 0.97;
}

async function fetchMarketPages(order, pages, { ascending = false, signal } = {}) {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) => provider.getMarkets({ order, ascending, limit: 100, offset: i * 100, signal })),
  );
  const seen = new Set();
  return results
    .flat()
    .map(normalizeMarket)
    .filter((m) => m && (seen.has(m.conditionId) ? false : seen.add(m.conditionId)));
}

/** Top ~300 active markets by 24h volume - the shared base for lists + pulse. */
export async function getActiveMarkets({ signal } = {}) {
  return cached("markets:active:volume", LIST_TTL, () => fetchMarketPages("volume24hr", 3, { signal }));
}

export async function getMarketsList({ sort = "volume", limit = 60, signal } = {}) {
  if (sort === "liquidity") {
    return cached("markets:liquidity", LIST_TTL, () => fetchMarketPages("liquidityNum", 1, { signal })).then((l) => l.slice(0, limit));
  }
  const base = await getActiveMarkets({ signal });
  const now = Date.now();
  let list = [...base];
  if (sort === "movers") {
    list = list.filter((m) => m.change1d != null && (m.volume24h ?? 0) >= 10_000 && isLive(m)).sort((a, b) => Math.abs(b.change1d) - Math.abs(a.change1d));
  } else if (sort === "ending") {
    list = list.filter((m) => m.endDate && new Date(m.endDate).getTime() > now).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
  } else if (sort === "rewards") {
    list = list.filter((m) => m.rewardsDaily).sort((a, b) => b.rewardsDaily - a.rewardsDaily);
  }
  return list.slice(0, limit);
}

export async function searchMarkets(query, { signal } = {}) {
  const events = await provider.searchMarkets(query, { limit: 12, signal });
  const out = [];
  for (const event of events) {
    for (const raw of event.markets || []) {
      if (raw.closed || raw.active === false) continue;
      out.push(normalizeMarket({ ...raw, events: [{ slug: event.slug, title: event.title, icon: event.icon }] }));
    }
  }
  return out.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0)).slice(0, 60);
}

// ---------------------------------------------------------------------------
// Market detail
// ---------------------------------------------------------------------------

export async function getMarketDetail(identifier, { signal } = {}) {
  return cached(`market:${identifier}`, LIST_TTL, async () => normalizeMarket(await provider.getMarket(identifier, { signal })));
}

export const PRICE_RANGES = {
  "1D": { interval: "1d", fidelity: 5 },
  "1W": { interval: "1w", fidelity: 60 },
  "1M": { interval: "1m", fidelity: 240 },
  ALL: { interval: "max", fidelity: 1440 },
};

export async function getMarketPriceHistory(tokenId, range = "1W", { signal } = {}) {
  const params = PRICE_RANGES[range] || PRICE_RANGES["1W"];
  return cached(`price:${tokenId}:${range}`, LIST_TTL, async () => {
    const rows = await provider.getPriceHistory(tokenId, { ...params, signal });
    return rows.filter((r) => Number.isFinite(r.t) && Number.isFinite(r.p)).map((r) => ({ t: r.t * 1000, p: r.p }));
  });
}

/**
 * Top holders on each outcome, each tagged with their all-time leaderboard
 * PnL, plus a smart-money summary: how much of each side is held by wallets
 * that are profitable all-time.
 */
export async function getMarketHolders(market, { perSide = 10, signal } = {}) {
  const groups = await provider.getHolders(market.conditionId, { limit: 20, signal });
  const sides = market.outcomes.map((outcome) => {
    const group = groups.find((g) => g.token === outcome.tokenId);
    const holders = (group?.holders || []).slice(0, perSide).map((h) => ({
      address: h.proxyWallet,
      account: {
        address: h.proxyWallet,
        username: h.name || null,
        displayName: h.pseudonym || null,
        avatar: h.profileImageOptimized || h.profileImage || null,
      },
      shares: num(h.amount),
      value: num(h.amount) != null && outcome.price != null ? num(h.amount) * outcome.price : null,
    }));
    return { outcome, holders };
  });

  const wallets = [...new Set(sides.flatMap((s) => s.holders.map((h) => h.address)).filter(Boolean))];
  const records = new Map();
  await Promise.all(wallets.map(async (w) => records.set(w, await getWalletAllTime(w, { signal }).catch(() => null))));

  return sides.map(({ outcome, holders }) => {
    const enriched = holders.map((h) => ({ ...h, allTime: records.get(h.address) || null }));
    const smart = enriched.filter((h) => (h.allTime?.pnl ?? 0) > 0);
    return {
      outcome,
      holders: enriched,
      smartCount: smart.length,
      smartValue: smart.reduce((sum, h) => sum + (h.value || 0), 0),
      totalValue: enriched.reduce((sum, h) => sum + (h.value || 0), 0),
      smartPnl: smart.reduce((sum, h) => sum + (h.allTime?.pnl || 0), 0),
    };
  });
}

export async function getMarketTrades(conditionId, { minCash = 100, limit = 40, signal } = {}) {
  return getWhaleTrades({ market: conditionId, minCash, limit, signal });
}

// ---------------------------------------------------------------------------
// Market pulse (dashboard)
// ---------------------------------------------------------------------------

export async function getMarketPulse({ signal } = {}) {
  const [markets, whales] = await Promise.all([
    getActiveMarkets({ signal }),
    getWhaleTrades({ minCash: 10_000, limit: 500, enrich: false, signal }).catch(() => []),
  ]);
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const lastHour = whales.filter((t) => (t.timestamp ?? 0) >= hourAgo);
  const sum = (list, key) => list.reduce((acc, m) => acc + (m[key] || 0), 0);
  const buys = lastHour.filter((t) => t.side === "BUY");
  const byCategory = new Map();
  for (const m of markets) {
    const key = classifyMarket(`${m.eventTitle || ""} ${m.question}`);
    const g = byCategory.get(key) || { category: key, markets: 0, volume24h: 0 };
    g.markets += 1;
    g.volume24h += m.volume24h || 0;
    byCategory.set(key, g);
  }
  const categories = [...byCategory.values()].sort((a, b) => b.volume24h - a.volume24h);
  return {
    marketCount: markets.length,
    volume24h: sum(markets, "volume24h"),
    liquidity: sum(markets, "liquidity"),
    rewardsDaily: sum(markets, "rewardsDaily"),
    whaleCount1h: lastHour.length,
    whaleNotional1h: sum(lastHour, "notional"),
    whaleBuyShare: lastHour.length ? buys.length / lastHour.length : null,
    topVolume: markets.slice(0, 8),
    gainers: markets.filter((m) => (m.change1d ?? 0) > 0 && (m.volume24h ?? 0) >= 10_000 && isLive(m)).sort((a, b) => b.change1d - a.change1d).slice(0, 6),
    losers: markets.filter((m) => (m.change1d ?? 0) < 0 && (m.volume24h ?? 0) >= 10_000 && isLive(m)).sort((a, b) => a.change1d - b.change1d).slice(0, 6),
    recentWhales: whales.slice(0, 8),
    categories,
    updatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Order book
// ---------------------------------------------------------------------------

/** Best-first order book levels with cumulative depth: { bids, asks, mid, spread }. */
export async function getOrderBook(tokenId, { depth = 12, signal } = {}) {
  const raw = await provider.getOrderBook(tokenId, { signal });
  if (!raw) return null;
  const levels = (rows, desc) =>
    (rows || [])
      .map((r) => ({ price: num(r.price), size: num(r.size) }))
      .filter((r) => r.price != null && r.size != null && r.size > 0)
      .sort((a, b) => (desc ? b.price - a.price : a.price - b.price))
      .slice(0, depth);
  const withTotals = (rows) => {
    let total = 0;
    return rows.map((r) => {
      total += r.size * r.price;
      return { ...r, notional: r.size * r.price, total };
    });
  };
  const bids = withTotals(levels(raw.bids, true));
  const asks = withTotals(levels(raw.asks, false));
  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  return {
    bids,
    asks,
    bestBid,
    bestAsk,
    mid: bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null,
    spread: bestBid != null && bestAsk != null ? bestAsk - bestBid : null,
    lastTrade: num(raw.last_trade_price),
    updatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Arbitrage scanner
// ---------------------------------------------------------------------------

/**
 * Scans multi-outcome (negRisk) events, where exactly one outcome resolves
 * YES. Buying YES on every outcome at the best asks pays $1, so a basket
 * under $1 is a gross edge; selling YES on every outcome at the best bids
 * above $1 is the mirror case. Covers every negRisk event among the ~300
 * most active markets, using gamma top-of-book quotes - depth and fees are
 * not included.
 */
export async function getArbOpportunities({ signal } = {}) {
  return cached("arb:scan", LIST_TTL, async () => {
    const markets = await getActiveMarkets({ signal });
    const eventIds = [...new Set(markets.filter((m) => m.negRisk && m.eventId).map((m) => m.eventId))];
    const events = await Promise.all(
      eventIds.map((id) =>
        provider.getEvent(id, { signal }).catch((err) => {
          if (err?.name === "AbortError") throw err;
          return null;
        }),
      ),
    );
    const out = [];
    for (const event of events) {
      if (!event?.negRisk) continue;
      const legsRaw = (event.markets || []).filter((m) => m.active !== false && !m.closed && m.acceptingOrders !== false);
      if (legsRaw.length < 2) continue;
      const asks = legsRaw.map((m) => num(m.bestAsk));
      const bids = legsRaw.map((m) => num(m.bestBid));
      const base = {
        id: event.id,
        title: event.title,
        slug: event.slug,
        icon: event.icon || event.image || null,
        outcomes: legsRaw.length,
        volume24h: num(event.volume24hr) ?? 0,
        liquidity: num(event.liquidity),
        endDate: event.endDate ?? null,
        legs: legsRaw
          .map((m, i) => ({ name: m.groupItemTitle || m.question, ask: asks[i], bid: bids[i], slug: m.slug }))
          .sort((x, y) => (y.ask ?? 0) - (x.ask ?? 0)),
      };
      // Augmented events can resolve to an unlisted outcome, so buying every
      // listed YES is not a complete basket there. Selling stays valid.
      if (!event.negRiskAugmented && asks.every((v) => v != null && v > 0)) {
        const cost = asks.reduce((sum, v) => sum + v, 0);
        if (cost < 1) out.push({ ...base, key: `${event.id}-buy`, kind: "buy", basket: cost, edge: 1 - cost });
      }
      if (bids.every((v) => v != null && v > 0)) {
        const proceeds = bids.reduce((sum, v) => sum + v, 0);
        if (proceeds > 1) out.push({ ...base, key: `${event.id}-sell`, kind: "sell", basket: proceeds, edge: proceeds - 1 });
      }
    }
    return { list: out.sort((x, y) => y.edge - x.edge), eventsScanned: events.filter(Boolean).length };
  });
}
