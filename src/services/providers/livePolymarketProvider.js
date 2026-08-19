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

export async function getClosedPositions(address, { limit = 50, signal } = {}) {
  const url = `${DATA_BASE}/closed-positions?user=${encodeURIComponent(address)}&limit=${limit}&sortBy=TIMESTAMP&sortDirection=DESC`;
  const data = await getJson(url, { signal });
  return Array.isArray(data) ? data : [];
}

export async function getActivity(address, { limit = 500, signal } = {}) {
  const url = `${DATA_BASE}/activity?user=${encodeURIComponent(address)}&limit=${limit}&sortBy=TIMESTAMP&sortDirection=DESC`;
  const data = await getJson(url, { signal });
  return Array.isArray(data) ? data : [];
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

const PERF_BUCKETS = { "1D": 24, "1W": 14, "1M": 24, "3M": 26, ALL: 36 };

function round2(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Builds an independent cumulative-volume series for one timeframe from the
 * account's real activity feed. Each range filters a different window, uses
 * a different bucket count, and reports its own total/change/percentage, so
 * no two ranges ever share the same array.
 */
export async function getPerformanceRange(address, { range = "ALL", signal } = {}) {
  const windowMs = PERF_RANGE_MS[range];
  const buckets = PERF_BUCKETS[range] || PERF_BUCKETS.ALL;

  const activity = await getActivity(address, { limit: 500, signal });
  const entries = (activity || [])
    .map((a) => ({ t: (a.timestamp ?? 0) * 1000, amount: a.usdcSize ?? 0 }))
    .filter((e) => e.t > 0 && e.amount > 0)
    .sort((a, b) => a.t - b.t);

  if (entries.length === 0) return null;

  const now = Date.now();
  const cutoff = windowMs ? now - windowMs : entries[0].t;
  const inWindow = entries.filter((e) => e.t >= cutoff);
  const baseline = entries.reduce((sum, e) => sum + (e.t < cutoff ? e.amount : 0), 0);

  if (inWindow.length === 0) return null;

  const spanMs = Math.max(now - cutoff, buckets);
  const bucketMs = spanMs / buckets;
  const bucketSums = new Array(buckets).fill(0);
  for (const e of inWindow) {
    const idx = Math.min(buckets - 1, Math.floor((e.t - cutoff) / bucketMs));
    bucketSums[idx] += e.amount;
  }

  let acc = round2(baseline);
  const points = bucketSums.map((sum, i) => {
    acc = round2(acc + sum);
    return { date: new Date(cutoff + (i + 1) * bucketMs).toISOString(), value: acc };
  });

  const total = acc;
  const first = points[0].value;
  const change = round2(total - first);
  const changePct = first !== 0 ? change / first : null;
  return { points, total, change, changePct };
}
