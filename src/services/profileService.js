// Builds the complete public profile bundle for one resolved account:
// overview stats, positions, resolved history and activity. Everything is
// fetched once per profile load and cached, so switching tabs never
// refetches. The performance chart is NOT part of the bundle: each timeframe
// is fetched on demand via getPerformanceRange so switching ranges loads a
// genuinely different historical series instead of reusing one dataset.
//
// Profit summary strip prefers lb-api /profit (Betmoar) for performance;
// volume still uses the volume series change.

import { provider } from "./providers";
import { cacheGet, cacheSet } from "./cache";
import { NotFoundError } from "./errors";
import { resolveIdentifier, getAccountByAddress, getLeaderboardEntryForAddress } from "./polymarketService";
import { mergeAccounts } from "../adapters/accountAdapter";
import { normalizePosition, normalizeClosedPosition, normalizeActivity, deriveStats } from "../adapters/profileAdapter";

const BUNDLE_TTL = 45_000;
const OVERVIEW_TTL = 45_000;
const OVERVIEW_POSITIONS_LIMIT = 100;
const PERF_TTL = 60_000;
const SUMMARY_TTL = 60_000;

const VALID_RANGES = new Set(["1D", "1W", "1M", "3M", "ALL"]);
const VALID_METRICS = new Set(["performance", "volume"]);

/** UI range → lb-api profit window (90D has no lb window). */
const LB_PROFIT_WINDOW = {
  "1D": "1d",
  "1W": "7d",
  "1M": "30d",
  ALL: "all",
};

/** Fallback leaderboard timePeriod when lb-api misses. */
const LB_TIME_PERIOD = {
  "1D": "DAY",
  "1W": "WEEK",
  "1M": "MONTH",
  ALL: "ALL",
};

const SUMMARY_RANGES = ["1D", "1W", "1M", "3M", "ALL"];

async function settle(promise) {
  try {
    return await promise;
  } catch {
    return null;
  }
}

function buildBundle({ account, rawPositions, positions: normalizedPositions, rawClosed, rawActivity, value, traded, rankEntry, cashBalance }) {
  const positions = Array.isArray(rawPositions) ? rawPositions.map(normalizePosition) : (normalizedPositions ?? null);
  const resolvedPositions = Array.isArray(rawClosed) ? rawClosed.map(normalizeClosedPosition) : null;
  const activity = Array.isArray(rawActivity)
    ? rawActivity.map(normalizeActivity).sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
    : null;

  return {
    account,
    stats: deriveStats({
      positions,
      closedPositions: resolvedPositions,
      value,
      traded,
      rankEntry,
      publicProfile: account,
      account,
      cashBalance,
    }),
    positions,
    resolvedPositions,
    activity,
  };
}

/**
 * Fast first-stage profile payload. Deep history is deliberately excluded so
 * one long pagination walk cannot hold the entire page in its skeleton state.
 */
export async function getAccountProfileOverview(identifier, { signal } = {}) {
  const account = await resolveIdentifier(identifier, { signal });
  const address = account.address.toLowerCase();

  const fullCached = cacheGet(`profile:${address}`);
  if (fullCached) return fullCached;

  const cacheKey = `profile:${address}:overview`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const [rawPositions, value, traded, rankEntry, publicProfileAccount] = await Promise.all([
    settle(provider.getPositions(address, { maxEvents: OVERVIEW_POSITIONS_LIMIT, signal })),
    settle(provider.getValue(address, { signal })),
    settle(provider.getTraded(address, { signal })),
    getLeaderboardEntryForAddress(address, { timePeriod: "ALL", signal }),
    settle(getAccountByAddress(address, { signal })),
  ]);

  const enrichedAccount = mergeAccounts(mergeAccounts(rankEntry, account), publicProfileAccount);
  if (publicProfileAccount) {
    enrichedAccount.tier = publicProfileAccount.tier ?? enrichedAccount.tier ?? null;
    enrichedAccount.tierName = publicProfileAccount.tierName ?? enrichedAccount.tierName ?? null;
  }

  const hasIdentity = Boolean(account.username || account.displayName || account.bio || account.avatar);
  const hasAnalytics =
    (rawPositions?.length ?? 0) > 0 ||
    (value != null && value > 0) ||
    (traded != null && traded > 0) ||
    rankEntry != null;
  if (!hasIdentity && !hasAnalytics) {
    // A wallet can have resolved history without a current position or Gamma
    // identity. Use the complete path only for this otherwise-empty edge case.
    return getAccountProfile(identifier, { signal });
  }

  const bundle = buildBundle({
    account: enrichedAccount,
    rawPositions: rawPositions || [],
    rawClosed: null,
    rawActivity: null,
    value,
    traded,
    rankEntry,
    cashBalance: null,
  });
  cacheSet(cacheKey, bundle, OVERVIEW_TTL);
  return bundle;
}

/** Fill the fast overview with complete positions, resolved history and activity. */
export async function hydrateAccountProfile(overview, { signal } = {}) {
  const address = overview?.account?.address?.toLowerCase();
  if (!address) throw new NotFoundError();

  const cacheKey = `profile:${address}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const [rawPositions, rawClosed, rawActivity, cashBalance] = await Promise.all([
    settle(provider.getPositions(address, { signal })),
    settle(provider.getClosedPositions(address, { signal })),
    settle(provider.getActivity(address, { signal })),
    settle(provider.getCashBalance?.(address, { signal }) ?? Promise.resolve(null)),
  ]);

  const bundle = buildBundle({
    account: overview.account,
    rawPositions,
    positions: overview.positions,
    rawClosed: rawClosed || [],
    rawActivity: rawActivity || [],
    value: overview.stats?.positionsValue,
    traded: overview.stats?.marketsTraded,
    rankEntry: {
      rank: overview.stats?.rank,
      volume: overview.stats?.volume,
    },
    cashBalance: cashBalance ?? overview.stats?.cashBalance,
  });
  cacheSet(cacheKey, bundle, BUNDLE_TTL);
  return bundle;
}

/**
 * Resolves an identifier (username or address) and fetches everything
 * needed to render its public profile. Every section derives from this one
 * bundle, so no part of the page can end up mixing data from two accounts.
 */
export async function getAccountProfile(identifier, { signal } = {}) {
  const account = await resolveIdentifier(identifier, { signal });
  const address = account.address.toLowerCase();

  const cacheKey = `profile:${address}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const [rawPositions, rawClosed, rawActivity, value, traded, rankEntry, publicProfileAccount, cashBalance] =
    await Promise.all([
      settle(provider.getPositions(address, { signal })),
      settle(provider.getClosedPositions(address, { signal })),
      settle(provider.getActivity(address, { signal })),
      settle(provider.getValue(address, { signal })),
      settle(provider.getTraded(address, { signal })),
      getLeaderboardEntryForAddress(address, { timePeriod: "ALL", signal }),
      settle(getAccountByAddress(address, { signal })),
      settle(provider.getCashBalance?.(address, { signal }) ?? Promise.resolve(null)),
    ]);

  // Merge precedence: the leaderboard row is authoritative for volume, PnL
  // and rank (gamma's weightedVolume can be 0 - or far smaller - for
  // accounts that are active on the leaderboard), then the identity/search
  // account, then the gamma profile to fill in fields the leaderboard lacks
  // (bio, avatar). Live taker tier always comes from public-profile.
  const enrichedAccount = mergeAccounts(mergeAccounts(rankEntry, account), publicProfileAccount);
  if (publicProfileAccount) {
    enrichedAccount.tier = publicProfileAccount.tier ?? enrichedAccount.tier ?? null;
    enrichedAccount.tierName = publicProfileAccount.tierName ?? enrichedAccount.tierName ?? null;
  }

  const positions = (rawPositions || []).map(normalizePosition);
  const resolvedPositions = (rawClosed || []).map(normalizeClosedPosition);
  const activity = (rawActivity || [])
    .map(normalizeActivity)
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

  const hasIdentity = Boolean(account.username || account.displayName || account.bio || account.avatar);
  const hasAnalytics =
    positions.length > 0 ||
    resolvedPositions.length > 0 ||
    activity.length > 0 ||
    (value != null && value > 0) ||
    (traded != null && traded > 0) ||
    rankEntry != null ||
    (cashBalance != null && cashBalance > 0);
  if (!hasIdentity && !hasAnalytics) {
    throw new NotFoundError();
  }

  const stats = deriveStats({
    positions,
    closedPositions: resolvedPositions,
    value,
    traded,
    rankEntry,
    publicProfile: enrichedAccount,
    account: enrichedAccount,
    cashBalance,
  });

  const bundle = {
    account: enrichedAccount,
    stats,
    positions,
    resolvedPositions,
    activity,
  };

  cacheSet(cacheKey, bundle, BUNDLE_TTL);
  return bundle;
}

/**
 * Fetches one timeframe's performance series for an account, on demand, and
 * caches it independently per range AND metric. Each combination resolves
 * through the active provider, so every timeframe can supply its own
 * historical dataset.
 */
export async function getPerformanceRange(identifier, { range = "1M", metric = "performance", signal } = {}) {
  const rangeKey = VALID_RANGES.has(range) ? range : "1M";
  const metricKey = VALID_METRICS.has(metric) ? metric : "performance";
  const account = await resolveIdentifier(identifier, { signal });
  const address = account.address.toLowerCase();

  const cacheKey = `profile:${address}:perf:${rangeKey}:${metricKey}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const data = await provider.getPerformanceRange(address, { range: rangeKey, metric: metricKey, signal });
  cacheSet(cacheKey, data, PERF_TTL);
  return data;
}

function summaryPayload(change, source) {
  if (change == null || !Number.isFinite(change)) return null;
  return { change, total: change, startValue: 0, endValue: change, source };
}

/**
 * Timeframe summary strip values.
 * Performance: lb-api /profit (1D/7D/30D/ALL), user-pnl series for 90D,
 * then leaderboard pnl, then series change.
 * Volume: series change from activity.
 */
export async function getPerformanceSummary(identifier, { metric = "performance", signal } = {}) {
  const metricKey = VALID_METRICS.has(metric) ? metric : "performance";
  const account = await resolveIdentifier(identifier, { signal });
  const address = account.address.toLowerCase();

  const cacheKey = `profile:${address}:summary:${metricKey}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  if (metricKey === "volume") {
    const entries = await Promise.all(
      SUMMARY_RANGES.map(async (range) => {
        const data = await settle(getPerformanceRange(identifier, { range, metric: "volume", signal }));
        return [range, data ? summaryPayload(data.change, data.source || "activity") : null];
      }),
    );
    const result = Object.fromEntries(entries);
    cacheSet(cacheKey, result, SUMMARY_TTL);
    return result;
  }

  // Performance: prefer lb-api profit windows in parallel
  const [profit1d, profit7d, profit30d, profitAll, series3m, seriesAll, lbDay, lbWeek, lbMonth, lbAll] =
    await Promise.all([
      settle(provider.getUserProfit?.(address, "1d", { signal }) ?? Promise.resolve(null)),
      settle(provider.getUserProfit?.(address, "7d", { signal }) ?? Promise.resolve(null)),
      settle(provider.getUserProfit?.(address, "30d", { signal }) ?? Promise.resolve(null)),
      settle(provider.getUserProfit?.(address, "all", { signal }) ?? Promise.resolve(null)),
      settle(getPerformanceRange(identifier, { range: "3M", metric: "performance", signal })),
      settle(getPerformanceRange(identifier, { range: "ALL", metric: "performance", signal })),
      getLeaderboardEntryForAddress(address, { timePeriod: "DAY", signal }),
      getLeaderboardEntryForAddress(address, { timePeriod: "WEEK", signal }),
      getLeaderboardEntryForAddress(address, { timePeriod: "MONTH", signal }),
      getLeaderboardEntryForAddress(address, { timePeriod: "ALL", signal }),
    ]);

  function pick(range, profitAmount, lbEntry, series) {
    if (profitAmount != null && Number.isFinite(profitAmount)) {
      return summaryPayload(profitAmount, "lb-api");
    }
    if (lbEntry?.pnl != null && Number.isFinite(lbEntry.pnl)) {
      return summaryPayload(lbEntry.pnl, "leaderboard");
    }
    if (series?.change != null && Number.isFinite(series.change)) {
      return summaryPayload(series.change, series.source || "user-pnl-api");
    }
    return null;
  }

  // 90D: no lb window — use user-pnl series change
  const result = {
    "1D": pick("1D", profit1d, lbDay, null),
    "1W": pick("1W", profit7d, lbWeek, null),
    "1M": pick("1M", profit30d, lbMonth, null),
    "3M":
      series3m?.change != null
        ? summaryPayload(series3m.change, series3m.source || "user-pnl-api")
        : null,
    ALL: pick("ALL", profitAll, lbAll, seriesAll),
  };

  // Fill any remaining nulls from series fetch per range
  await Promise.all(
    SUMMARY_RANGES.map(async (range) => {
      if (result[range] != null) return;
      const series = await settle(getPerformanceRange(identifier, { range, metric: "performance", signal }));
      if (series?.change != null) {
        result[range] = summaryPayload(series.change, series.source || "user-pnl-api");
      }
    }),
  );

  cacheSet(cacheKey, result, SUMMARY_TTL);
  return result;
}

// Re-export mapping helpers for tests / callers
export { LB_PROFIT_WINDOW, LB_TIME_PERIOD, SUMMARY_RANGES };
