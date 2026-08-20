// Ecosystem-level analytics service: leaderboard, dashboard aggregates,
// trending/top lists, comparison and curated resources. Every analytics
// function here is backed by the ACTIVE data provider (the live Polymarket
// endpoints by default) so no surface displays invented numbers.
//
// Anything the public API does not expose - aggregate dashboard totals,
// activity trends, win-rate distributions, category counts, a global
// activity feed - resolves to null, and the pages render an explicit
// "unavailable" state instead of fabricating a value.
//
// Compare is built from real profile bundles (positions, activity, value)
// resolved through profileService for the two chosen addresses.

import { provider } from "./providers";
import { getAccountProfile, getPerformanceRange } from "./profileService";
import { normalizeLeaderboardEntry } from "../adapters/accountAdapter";
import { cacheGet, cacheSet } from "./cache";

const TTL = 45_000;

function cacheWrap(key, producer) {
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  const value = producer();
  cacheSet(key, value, TTL);
  return value;
}

const PERIOD_MAP = { DAY: "DAY", WEEK: "WEEK", MONTH: "MONTH", ALL: "ALL" };

/** orderBy values the public leaderboard endpoint actually supports. */
const METRIC_ORDER = { pnl: "PNL", volume: "VOL" };

/**
 * Fetches real leaderboard rows for one metric/period through the active
 * provider. Returns null when the requested metric has no genuine source
 * (e.g. win rate - the public API only orders by PNL or VOL).
 */
export async function getLeaderboard({ metric = "pnl", period = "ALL", limit = 25, signal } = {}) {
  const orderBy = METRIC_ORDER[metric];
  if (!orderBy) return null;
  const timePeriod = PERIOD_MAP[period] || "ALL";
  const raw = await provider.getLeaderboard({ category: "OVERALL", timePeriod, orderBy, limit, signal });
  return raw.map(normalizeLeaderboardEntry).filter((a) => a.address).slice(0, limit);
}

export async function getTopAccounts({ limit = 8, metric = "pnl", period = "ALL", signal } = {}) {
  return getLeaderboard({ metric, period, limit, signal });
}

/** Real leaderboard rows ordered by volume over the last week. */
export async function getTrendingAccounts({ limit = 5, signal } = {}) {
  return getLeaderboard({ metric: "volume", period: "WEEK", limit, signal });
}

/** Real leaderboard rows ordered by PnL over the last month. */
export async function getRecentAccounts({ limit = 5, signal } = {}) {
  return getLeaderboard({ metric: "pnl", period: "MONTH", limit, signal });
}

/**
 * Aggregate dashboard totals have no genuine public source, so this is
 * null rather than an estimated number. The dashboard marks it unavailable.
 */
export async function getDashboardStats() {
  return null;
}

/** No public aggregate activity-trend endpoint exists - returns null. */
export async function getActivityTrend() {
  return null;
}

/** No public performance-distribution endpoint exists - returns null. */
export async function getPerformanceDistribution() {
  return null;
}

/** No public category-market-count endpoint exists - returns null. */
export async function getCategoryBreakdown() {
  return null;
}

/** No public global activity feed exists - returns null. */
export async function getRecentActivityFeed() {
  return null;
}

function metricsFromBundle(bundle) {
  const s = bundle?.stats;
  if (!s) return null;
  return {
    pnl: s.pnl,
    volume: s.volume,
    winRate: s.winRate,
    markets: s.marketsTraded,
    portfolioValue: s.portfolioValue,
    activityCount: s.activityCount,
    openPositions: s.openPositionsCount,
  };
}

/**
 * Compares two real accounts by resolving each one's public profile bundle
 * (positions, resolved positions, activity, portfolio value) through the
 * active provider and deriving every metric from that data.
 */
export async function getCompare(a, b, { signal } = {}) {
  const build = async (identifier) => {
    try {
      const bundle = await getAccountProfile(identifier, { signal });
      const metrics = metricsFromBundle(bundle);
      if (!metrics) return null;
      const perf = await getPerformanceRange(identifier, { range: "ALL", metric: "performance", signal });
      return {
        account: bundle.account,
        metrics,
        performance: (perf && perf.points) || [],
        perfRange: perf,
      };
    } catch {
      return null;
    }
  };

  const [left, right] = await Promise.all([build(a), build(b)]);
  if (!left || !right) return null;
  return { a: left, b: right };
}

/**
 * Curated, editorially maintained directory of public resources - not a
 * computed analytics dataset. No values are fabricated; entries are static
 * references to existing tools/APIs.
 */
export function getEcosystemResources() {
  return cacheWrap("ecosystem:resources", () => [
    { name: "Gamma API", category: "Data", description: "Event, market and profile lookups for the whole Polymarket universe.", icon: "Database", status: "Public" },
    { name: "Data API", category: "Data", description: "Positions, activity, value and traded market endpoints for public accounts.", icon: "Activity", status: "Public" },
    { name: "Leaderboard API", category: "Analytics", description: "Ranked accounts by volume and profit across configurable time windows.", icon: "Trophy", status: "Public" },
    { name: "Market Calendars", category: "Research", description: "Upcoming event calendars and resolution schedules for active markets.", icon: "Calendar", status: "Demo" },
    { name: "Strategy Guides", category: "Education", description: "Walkthroughs of position building, spreads and market structure.", icon: "BookOpen", status: "Demo" },
    { name: "Python SDK", category: "Developer Tools", description: "Client library for querying public market and account data programmatically.", icon: "Terminal", status: "Demo" },
    { name: "Volume Screener", category: "Analytics", description: "Surfaces the most actively traded markets and recent volume shifts.", icon: "BarChart3", status: "Demo" },
    { name: "Outcome Tracker", category: "Research", description: "Tracks resolution outcomes and historical win rates across categories.", icon: "TrendingUp", status: "Demo" },
    { name: "CLI Explorer", category: "Developer Tools", description: "Terminal tool for fast account and position lookups.", icon: "Wrench", status: "Demo" },
    { name: "Category Reports", category: "Analytics", description: "Aggregated performance breakdowns by market category.", icon: "PieChart", status: "Demo" },
  ]);
}