// Live provider backed by Polymarket public endpoints (Betmoar-accurate).
// See POLYMARKET_DATA.md for the source of truth.
//
// - gamma-api     profile / search
// - data-api      positions, closed, activity, value, traded, leaderboard
// - user-pnl-api  official PnL time series (Performance chart)
// - lb-api        period profit windows (summary strip)
// - Polygon RPC   cash balances (pUSD + USDC.e + USDC)

import { ProviderError } from "../errors";
import { GAMMA_BASE, DATA_BASE, USER_PNL_BASE, LB_BASE } from "./polymarketConfig";
import { fetchCashBalance } from "./cashBalance";

async function getJson(url, { signal } = {}) {
  let res;
  try {
    res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new ProviderError("Network request failed");
  }
  if (!res.ok) {
    throw new ProviderError(`Request failed with status ${res.status}`);
  }
  try {
    return await res.json();
  } catch {
    throw new ProviderError("Received an invalid response");
  }
}

export async function searchProfiles(query, { limit = 8, signal } = {}) {
  const url = `${GAMMA_BASE}/public-search?q=${encodeURIComponent(query)}&search_profiles=true&limit_per_type=${limit}`;
  const data = await getJson(url, { signal });
  return Array.isArray(data?.profiles) ? data.profiles : [];
}

export async function getPublicProfileByAddress(address, { signal } = {}) {
  const url = `${GAMMA_BASE}/public-profile?address=${encodeURIComponent(address)}`;
  try {
    return await getJson(url, { signal });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    return null;
  }
}

export async function getLeaderboard({
  category = "OVERALL",
  timePeriod = "DAY",
  orderBy = "PNL",
  limit = 25,
  offset = 0,
  user,
  userName,
  signal,
} = {}) {
  const params = new URLSearchParams({
    category,
    timePeriod,
    orderBy,
    limit: String(limit),
    offset: String(offset),
  });
  if (user) params.set("user", user);
  if (userName) params.set("userName", userName);
  const data = await getJson(`${DATA_BASE}/v1/leaderboard?${params.toString()}`, { signal });
  return Array.isArray(data) ? data : [];
}

export async function getPositions(address, { signal } = {}) {
  return getCachedPositions(address, { signal });
}

export async function getClosedPositions(address, { signal } = {}) {
  return getCachedClosed(address, { signal });
}

export async function getActivity(address, { signal } = {}) {
  return getCachedActivity(address, { signal });
}

export async function getValue(address, { signal } = {}) {
  const url = `${DATA_BASE}/value?user=${encodeURIComponent(address)}`;
  const data = await getJson(url, { signal });
  return Array.isArray(data) && data[0] ? data[0].value : null;
}

export async function getTraded(address, { signal } = {}) {
  const url = `${DATA_BASE}/traded?user=${encodeURIComponent(address)}`;
  const data = await getJson(url, { signal });
  return typeof data?.traded === "number" ? data.traded : null;
}

/** Polygon cash (pUSD + USDC.e + USDC). */
export async function getCashBalance(address, { signal } = {}) {
  return fetchCashBalance(address, { signal });
}

/**
 * Period profit from lb-api.
 * @param {string} address
 * @param {"1d"|"7d"|"30d"|"all"} window
 */
export async function getUserProfit(address, window = "1d", { signal } = {}) {
  const user = String(address).toLowerCase();
  const url = `${LB_BASE}/profit?address=${encodeURIComponent(user)}&window=${encodeURIComponent(window)}&limit=1`;
  try {
    const data = await getJson(url, { signal });
    if (Array.isArray(data) && data[0] && Number.isFinite(data[0].amount)) {
      return data[0].amount;
    }
    return null;
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    return null;
  }
}

const PERF_RANGE_MS = {
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  "3M": 90 * 24 * 60 * 60 * 1000,
  ALL: null,
};

/** UI range → user-pnl-api interval/fidelity (POLYMARKET_DATA.md §8). */
const USER_PNL_PARAMS = {
  "1D": { interval: "1d", fidelity: "1h" },
  "1W": { interval: "1w", fidelity: "3h" },
  "1M": { interval: "1m", fidelity: "12h" },
  "3M": { interval: "max", fidelity: "1d", filterMs: PERF_RANGE_MS["3M"] },
  ALL: { interval: "max", fidelity: "1d" },
};

const VALID_PERF_METRICS = new Set(["performance", "volume"]);

const POSITIONS_PAGE_SIZE = 100;
const CLOSED_PAGE_SIZE = 50;
const ACTIVITY_PAGE_SIZE = 100;
const MAX_POSITIONS = 2000;
const MAX_CLOSED = 5000;
const MAX_ACTIVITY = 1500;
const FEED_CACHE_TTL = 60_000;

const activityCache = new Map();
const closedCache = new Map();
const positionsCache = new Map();
const userPnlCache = new Map();

function round2(value) {
  return Math.round(value * 100) / 100;
}

async function fetchPositionsHistory(address, { maxEvents = MAX_POSITIONS, signal } = {}) {
  const out = [];
  let offset = 0;
  while (out.length < maxEvents) {
    const params = new URLSearchParams({
      user: address,
      sizeThreshold: "0.1",
      limit: String(POSITIONS_PAGE_SIZE),
      offset: String(offset),
      sortBy: "CURRENT",
      sortDirection: "DESC",
    });
    const data = await getJson(`${DATA_BASE}/positions?${params}`, { signal });
    if (!Array.isArray(data) || data.length === 0) break;
    out.push(...data);
    if (data.length < POSITIONS_PAGE_SIZE) break;
    offset += POSITIONS_PAGE_SIZE;
  }
  return out.slice(0, maxEvents);
}

async function getCachedPositions(address, { signal } = {}) {
  const hit = positionsCache.get(address);
  if (hit && Date.now() - hit.fetchedAt < FEED_CACHE_TTL && hit.events.length > 0) {
    return hit.events;
  }
  const events = await fetchPositionsHistory(address, { signal });
  if (events.length > 0) positionsCache.set(address, { events, fetchedAt: Date.now() });
  return events;
}

async function fetchActivityHistory(address, { maxEvents = MAX_ACTIVITY, signal } = {}) {
  const out = [];
  let offset = 0;
  while (out.length < maxEvents) {
    const params = new URLSearchParams({
      user: address,
      limit: String(ACTIVITY_PAGE_SIZE),
      offset: String(offset),
      sortBy: "TIMESTAMP",
      sortDirection: "DESC",
      excludeDepositsWithdrawals: "false",
    });
    const data = await getJson(`${DATA_BASE}/activity?${params}`, { signal });
    if (!Array.isArray(data) || data.length === 0) break;
    out.push(...data);
    if (data.length < ACTIVITY_PAGE_SIZE) break;
    offset += ACTIVITY_PAGE_SIZE;
  }
  return out.slice(0, maxEvents);
}

async function getCachedActivity(address, { signal } = {}) {
  const hit = activityCache.get(address);
  if (hit && Date.now() - hit.fetchedAt < FEED_CACHE_TTL && hit.events.length > 0) {
    return hit.events;
  }
  const events = await fetchActivityHistory(address, { signal });
  if (events.length > 0) activityCache.set(address, { events, fetchedAt: Date.now() });
  return events;
}

async function fetchClosedHistory(address, { maxEvents = MAX_CLOSED, signal } = {}) {
  const out = [];
  let offset = 0;
  while (out.length < maxEvents) {
    const params = new URLSearchParams({
      user: address,
      limit: String(CLOSED_PAGE_SIZE),
      offset: String(offset),
      sortBy: "TIMESTAMP",
      sortDirection: "DESC",
    });
    const data = await getJson(`${DATA_BASE}/closed-positions?${params}`, { signal });
    if (!Array.isArray(data) || data.length === 0) break;
    out.push(...data);
    if (data.length < CLOSED_PAGE_SIZE) break;
    offset += CLOSED_PAGE_SIZE;
  }
  return out.slice(0, maxEvents);
}

async function getCachedClosed(address, { signal } = {}) {
  const hit = closedCache.get(address);
  if (hit && Date.now() - hit.fetchedAt < FEED_CACHE_TTL && hit.events.length > 0) {
    return hit.events;
  }
  const events = await fetchClosedHistory(address, { signal });
  if (events.length > 0) closedCache.set(address, { events, fetchedAt: Date.now() });
  return events;
}

function volumeContribution(event) {
  if (event.type !== "TRADE") return 0;
  return event.usdcSize ?? 0;
}

/**
 * Fetch official user PnL series from user-pnl-api.
 * Points: { t: unixSeconds, p: cumulativePnl }
 */
async function fetchUserPnlSeries(address, { interval, fidelity, signal } = {}) {
  const user = String(address).toLowerCase();
  const cacheKey = `${user}:${interval}:${fidelity}`;
  const hit = userPnlCache.get(cacheKey);
  if (hit && Date.now() - hit.fetchedAt < FEED_CACHE_TTL) {
    return hit.points;
  }

  const url = `${USER_PNL_BASE}/user-pnl?user_address=${encodeURIComponent(user)}&interval=${encodeURIComponent(interval)}&fidelity=${encodeURIComponent(fidelity)}`;
  const data = await getJson(url, { signal });
  const points = Array.isArray(data)
    ? data
        .filter((row) => row && Number.isFinite(row.t) && Number.isFinite(row.p))
        .map((row) => ({ t: row.t, p: row.p }))
        .sort((a, b) => a.t - b.t)
    : [];

  userPnlCache.set(cacheKey, { points, fetchedAt: Date.now() });
  return points;
}

/**
 * Betmoar-style rebase of user-pnl series into chart payload.
 */
function transformUserPnlSeries(rawPoints, rangeKey) {
  if (!rawPoints || rawPoints.length === 0) return null;

  const params = USER_PNL_PARAMS[rangeKey] || USER_PNL_PARAMS.ALL;
  let series = rawPoints.map((row) => ({ tMs: row.t * 1000, p: row.p }));

  if (params.filterMs) {
    const cutoff = Date.now() - params.filterMs;
    const before = series.filter((p) => p.tMs < cutoff);
    const inWindow = series.filter((p) => p.tMs >= cutoff);
    if (inWindow.length === 0) return null;
    const baseline = before.length > 0 ? before[before.length - 1].p : inWindow[0].p;
    const points = inWindow.map((p) => ({
      date: new Date(p.tMs).toISOString(),
      value: round2(p.p - baseline),
    }));
    const startValue = 0;
    const endValue = points[points.length - 1].value;
    const change = round2(endValue - startValue);
    return {
      points,
      total: endValue,
      change,
      changePct: null,
      startValue,
      endValue,
      metric: "performance",
      range: rangeKey,
      source: "user-pnl-api",
    };
  }

  if (rangeKey === "ALL") {
    const points = series.map((p) => ({
      date: new Date(p.tMs).toISOString(),
      value: round2(p.p),
    }));
    const endValue = points[points.length - 1].value;
    const change = round2(endValue);
    return {
      points,
      total: endValue,
      change,
      changePct: null,
      startValue: 0,
      endValue,
      metric: "performance",
      range: rangeKey,
      source: "user-pnl-api",
    };
  }

  // 1D / 1W / 1M: baseline = first point in the API window
  const baseline = series[0].p;
  const points = series.map((p) => ({
    date: new Date(p.tMs).toISOString(),
    value: round2(p.p - baseline),
  }));
  const startValue = 0;
  const endValue = points[points.length - 1].value;
  const change = round2(endValue - startValue);
  return {
    points,
    total: endValue,
    change,
    changePct: null,
    startValue,
    endValue,
    metric: "performance",
    range: rangeKey,
    source: "user-pnl-api",
  };
}

/** Fallback: cumulative closed-positions realized PnL (legacy path). */
async function getPerformanceFromClosed(address, { rangeKey, signal } = {}) {
  const windowMs = PERF_RANGE_MS[rangeKey];
  const raw = await getCachedClosed(address, { signal });
  const entries = (raw || [])
    .map((a) => ({
      t: (a.timestamp ?? 0) * 1000,
      v: a.realizedPnl ?? 0,
    }))
    .filter((e) => e.t > 0 && Number.isFinite(e.v) && e.v !== 0)
    .sort((a, b) => a.t - b.t);

  if (entries.length === 0) return null;

  const now = Date.now();
  const cutoff = windowMs ? now - windowMs : entries[0].t;
  const inWindow = entries.filter((e) => e.t >= cutoff);
  if (inWindow.length === 0) return null;

  const baseline = entries.reduce((sum, e) => sum + (e.t < cutoff ? e.v : 0), 0);
  const series = [{ t: cutoff, value: round2(baseline) }];
  let acc = baseline;
  for (const e of inWindow) {
    acc += e.v;
    series.push({ t: e.t, value: round2(acc) });
  }
  const endValue = round2(acc);
  if (series[series.length - 1].t < now) {
    series.push({ t: now, value: endValue });
  }

  const points = series.map((p) => ({
    date: new Date(p.t).toISOString(),
    value: p.value,
  }));
  const startValue = series[0].value;
  const change = round2(endValue - startValue);

  return {
    points,
    total: endValue,
    change,
    changePct: null,
    startValue,
    endValue,
    metric: "performance",
    range: rangeKey,
    source: "closed-positions",
  };
}

async function getVolumeFromActivity(address, { rangeKey, signal } = {}) {
  const windowMs = PERF_RANGE_MS[rangeKey];
  const raw = await getCachedActivity(address, { signal });
  const entries = (raw || [])
    .map((a) => ({
      t: (a.timestamp ?? 0) * 1000,
      v: volumeContribution(a),
    }))
    .filter((e) => e.t > 0 && Number.isFinite(e.v) && e.v !== 0)
    .sort((a, b) => a.t - b.t);

  if (entries.length === 0) return null;

  const now = Date.now();
  const cutoff = windowMs ? now - windowMs : entries[0].t;
  const inWindow = entries.filter((e) => e.t >= cutoff);
  if (inWindow.length === 0) return null;

  const baseline = entries.reduce((sum, e) => sum + (e.t < cutoff ? e.v : 0), 0);
  const series = [{ t: cutoff, value: round2(baseline) }];
  let acc = baseline;
  for (const e of inWindow) {
    acc += e.v;
    series.push({ t: e.t, value: round2(acc) });
  }
  const endValue = round2(acc);
  if (series[series.length - 1].t < now) {
    series.push({ t: now, value: endValue });
  }

  const points = series.map((p) => ({
    date: new Date(p.t).toISOString(),
    value: p.value,
  }));
  const startValue = series[0].value;
  const change = round2(endValue - startValue);

  return {
    points,
    total: endValue,
    change,
    changePct: null,
    startValue,
    endValue,
    metric: "volume",
    range: rangeKey,
    source: "activity",
  };
}

/**
 * Performance: user-pnl-api (Betmoar) with closed-positions fallback.
 * Volume: activity TRADE usdcSize cumulative.
 */
export async function getPerformanceRange(address, { range = "ALL", metric = "performance", signal } = {}) {
  const rangeKey = PERF_RANGE_MS[range] !== undefined ? range : "ALL";
  const metricKey = VALID_PERF_METRICS.has(metric) ? metric : "performance";

  if (metricKey === "volume") {
    return getVolumeFromActivity(address, { rangeKey, signal });
  }

  const params = USER_PNL_PARAMS[rangeKey] || USER_PNL_PARAMS.ALL;
  try {
    const raw = await fetchUserPnlSeries(address, {
      interval: params.interval,
      fidelity: params.fidelity,
      signal,
    });
    const transformed = transformUserPnlSeries(raw, rangeKey);
    if (transformed && transformed.points.length > 0) {
      if (import.meta.env.DEV) {
        console.debug(`[Timeframe Analytics]`, {
          canonicalAddress: address,
          metric: metricKey,
          range: rangeKey,
          source: "user-pnl-api",
          pointCount: transformed.points.length,
          change: transformed.change,
          endValue: transformed.endValue,
        });
      }
      return transformed;
    }
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    if (import.meta.env.DEV) {
      console.warn(`[user-pnl-api] fallback to closed-positions for ${address}`, err?.message);
    }
  }

  return getPerformanceFromClosed(address, { rangeKey, signal });
}
