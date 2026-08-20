// Live provider backed by Polymarket's documented public endpoints.
// See https://docs.polymarket.com/api-reference for the source of truth.
//
// - gamma-api.polymarket.com/public-search   search accounts (and markets/events)
// - gamma-api.polymarket.com/public-profile  look up one account by address
// - data-api.polymarket.com/v1/leaderboard   ranked accounts, filterable by user/username
// - data-api.polymarket.com/positions        open positions for an address
// - data-api.polymarket.com/closed-positions resolved positions for an address
// - data-api.polymarket.com/activity         trade/redeem/etc activity for an address
// - data-api.polymarket.com/value            current total position value
// - data-api.polymarket.com/traded           count of markets traded
//
// All of the above are public, unauthenticated, CORS-open GET endpoints.
// This file only does fetching + JSON parsing; shaping the data into the
// app's internal model happens in src/adapters.

import { ProviderError } from "../errors";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const DATA_BASE = "https://data-api.polymarket.com";

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
    // A missing gamma profile is common (many wallets never set one up) -
    // treat it as "no profile" rather than a hard failure.
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

export async function getPositions(address, { limit = 100, signal } = {}) {
  const url = `${DATA_BASE}/positions?user=${encodeURIComponent(address)}&limit=${limit}&sortBy=CURRENT&sortDirection=DESC`;
  const data = await getJson(url, { signal });
  return Array.isArray(data) ? data : [];
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

const PERF_RANGE_MS = {
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  "3M": 90 * 24 * 60 * 60 * 1000,
  ALL: null,
};

// Every real event in the window is returned as its own point so the chart
// preserves genuine small movements, peaks, dips and short-term volatility
// instead of aggregating them. The activity feed is capped at MAX_PERF_EVENTS
// (2000) and closed positions at 50, so even the densest window stays a
// manageable polyline.
const VALID_PERF_METRICS = new Set(["performance", "volume"]);

// The activity endpoint returns at most 500 events per page and the
// closed-positions endpoint returns at most 50 (it ignores larger limits).
// Paginate the bounded activity feed so volume can genuinely span weeks or
// months for accounts that trade less often than every few minutes.
const ACTIVITY_PAGE_SIZE = 500;
const MAX_PERF_EVENTS = 2000;
const ACTIVITY_CACHE_TTL = 60_000;

// All ranges/metrics for one account share the same fetched feeds, so
// switching timeframes or metrics never triggers another network call.
const activityCache = new Map();
const closedCache = new Map();

function round2(value) {
  return Math.round(value * 100) / 100;
}

async function fetchActivityHistory(address, { maxEvents = MAX_PERF_EVENTS, signal } = {}) {
  const out = [];
  let offset = 0;
  while (out.length < maxEvents) {
    const url = `${DATA_BASE}/activity?user=${encodeURIComponent(address)}&limit=${ACTIVITY_PAGE_SIZE}&offset=${offset}&sortBy=TIMESTAMP&sortDirection=DESC`;
    const data = await getJson(url, { signal });
    if (!Array.isArray(data) || data.length === 0) break;
    out.push(...data);
    if (data.length < ACTIVITY_PAGE_SIZE) break;
    offset += ACTIVITY_PAGE_SIZE;
  }
  return out.slice(0, maxEvents);
}

async function getCachedActivity(address, { signal } = {}) {
  const hit = activityCache.get(address);
  if (hit && Date.now() - hit.fetchedAt < ACTIVITY_CACHE_TTL && hit.events.length > 0) {
    return hit.events;
  }
  const events = await fetchActivityHistory(address, { signal });
  if (events.length > 0) activityCache.set(address, { events, fetchedAt: Date.now() });
  return events;
}

const CLOSED_PAGE_SIZE = 50;

async function fetchClosedHistory(address, { maxEvents = MAX_PERF_EVENTS, signal } = {}) {
  const out = [];
  let offset = 0;
  while (out.length < maxEvents) {
    const url = `${DATA_BASE}/closed-positions?user=${encodeURIComponent(address)}&limit=${CLOSED_PAGE_SIZE}&offset=${offset}&sortBy=TIMESTAMP&sortDirection=DESC`;
    const data = await getJson(url, { signal });
    if (!Array.isArray(data) || data.length === 0) break;
    out.push(...data);
    if (data.length < CLOSED_PAGE_SIZE) break;
    offset += CLOSED_PAGE_SIZE;
  }
  return out.slice(0, maxEvents);
}

async function getCachedClosed(address, { signal } = {}) {
  const hit = closedCache.get(address);
  if (hit && Date.now() - hit.fetchedAt < ACTIVITY_CACHE_TTL && hit.events.length > 0) {
    return hit.events;
  }
  const events = await fetchClosedHistory(address, { signal });
  if (events.length > 0) closedCache.set(address, { events, fetchedAt: Date.now() });
  return events;
}

/**
 * Per-event contribution to the volume series: notional traded on outright
 * buys/sells only (REDEEM/MERGE/etc. are not trades). A cumulative sum of
 * volume is monotonic (up/flat), which is the expected shape for volume.
 */
function volumeContribution(event) {
  if (event.type !== "TRADE") return 0;
  return event.usdcSize ?? 0;
}

/**
 * Builds an independent series for one timeframe and one metric:
 *
 *   performance (realized PnL) - Polymarket's authoritative closed-position
 *     realized PnL (GET /closed-positions). Each resolved position adds its
 *     realizedPnl at its resolution time, so the cumulative curve rises with
 *     wins and falls with losses and never includes still-open positions.
 *     The endpoint returns bounded resolved positions; the chart
 *     reflects exactly that window and never invents history.
 *
 *   volume (trading volume) - cumulative notional traded from the activity
 *     feed (GET /activity), monotonic up/flat by construction.
 *
 * Each range filters a different window and reports its own start/end value,
 * change and percentage - so no two ranges ever share the same dataset.
 */
export async function getPerformanceRange(address, { range = "ALL", metric = "performance", signal } = {}) {
  const rangeKey = PERF_RANGE_MS[range] !== undefined ? range : "ALL";
  const metricKey = VALID_PERF_METRICS.has(metric) ? metric : "performance";
  const windowMs = PERF_RANGE_MS[rangeKey];

  const raw = metricKey === "volume" ? await getCachedActivity(address, { signal }) : await getCachedClosed(address, { signal });
  const entries = (raw || [])
    .map((a) => ({
      t: (a.timestamp ?? 0) * 1000,
      v: metricKey === "volume" ? volumeContribution(a) : (a.realizedPnl ?? 0),
    }))
    .filter((e) => e.t > 0 && Number.isFinite(e.v) && e.v !== 0)
    .sort((a, b) => a.t - b.t);

  if (entries.length === 0) {
    if (import.meta.env.DEV) {
      console.log(`[Timeframe Analytics] range: ${rangeKey}, metric: ${metricKey}`, {
        selectedRange: rangeKey,
        earliestTimestamp: null,
        latestTimestamp: null,
        rawRecordCount: (raw || []).length,
        resolvedPositionCount: 0,
        startValue: null,
        endValue: null,
        calculatedPnL: null,
      });
    }
    return null;
  }

  const now = Date.now();
  const cutoff = windowMs ? now - windowMs : entries[0].t;
  const inWindow = entries.filter((e) => e.t >= cutoff);

  if (inWindow.length === 0) {
    if (import.meta.env.DEV) {
      console.log(`[Timeframe Analytics] range: ${rangeKey}, metric: ${metricKey}`, {
        selectedRange: rangeKey,
        earliestTimestamp: null,
        latestTimestamp: null,
        rawRecordCount: (raw || []).length,
        resolvedPositionCount: 0,
        startValue: null,
        endValue: null,
        calculatedPnL: null,
      });
    }
    return null;
  }

  const baseline = entries.reduce((sum, e) => sum + (e.t < cutoff ? e.v : 0), 0);

  // Full-density cumulative series: the value at the window start, then one
  // real point per event (so every genuine movement is preserved), then a
  // flat continuation to "now" so the curve reaches the right edge without
  // inventing events.
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
  const total = endValue;
  const change = round2(endValue - startValue);
  const changePct = null;

  if (import.meta.env.DEV) {
    const earliestTs = inWindow.length > 0 ? new Date(inWindow[0].t).toISOString() : null;
    const latestTs = inWindow.length > 0 ? new Date(inWindow[inWindow.length - 1].t).toISOString() : null;
    const vals = inWindow.map((e) => e.v);
    const minVal = vals.length > 0 ? Math.min(...vals) : null;
    const maxVal = vals.length > 0 ? Math.max(...vals) : null;
    console.debug(`[Timeframe Analytics]`, {
      canonicalAddress: address,
      metric: metricKey,
      range: rangeKey,
      rawRecordCount: (raw || []).length,
      filteredRecordCount: inWindow.length,
      firstTimestamp: earliestTs,
      lastTimestamp: latestTs,
      startValue,
      endValue,
      change,
      minValue: minVal,
      maxValue: maxVal,
    });
  }

  return { points, total, change, changePct, startValue, endValue, metric: metricKey, range: rangeKey };
}
