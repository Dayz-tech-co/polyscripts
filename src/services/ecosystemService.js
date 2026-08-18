// Ecosystem-level analytics service: leaderboard, dashboard aggregates,
// trending/top lists, comparison and curated resources. All of it is backed
// by the normalized demo dataset in src/providers/demoProvider.js so every
// surface stays internally consistent, and cached here so repeated requests
// within a session don't recompute anything. UI components consume these
// functions instead of importing provider data directly. Functions resolve
// asynchronously to match the rest of the service layer.

import * as demoProvider from "../providers/demoProvider";
import { cacheGet, cacheSet } from "./cache";

const TTL = 45_000;

function clean(account) {
  if (!account) return null;
  const { _seed, unrealizedPnl: _unrealizedPnl, realizedPnl: _realizedPnl, resolvedPositions: _resolvedPositions, ...rest } = account;
  return rest;
}

function cacheWrap(key, producer) {
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  const value = producer();
  cacheSet(key, value, TTL);
  return value;
}

function resolve(value) {
  return Promise.resolve(value);
}

export function getLeaderboard({ metric = "pnl", period = "ALL", limit = 25 } = {}) {
  return resolve(
    cacheWrap(`ecosystem:leaderboard:${metric}:${period}:${limit}`, () =>
      demoProvider.getLeaderboard({ metric, period, limit }).map((row) => ({ ...clean(row), rank: row.rank }))
    )
  );
}

export function getTopAccounts({ limit = 8, metric = "pnl", period = "ALL" } = {}) {
  return resolve(
    cacheWrap(`ecosystem:top:${metric}:${period}:${limit}`, () =>
      demoProvider.getTopAccounts({ limit, metric, period }).map((row) => ({ ...clean(row), rank: row.rank }))
    )
  );
}

export function getTrendingAccounts({ limit = 5 } = {}) {
  return resolve(
    cacheWrap(`ecosystem:trending:${limit}`, () =>
      demoProvider.getTrendingAccounts({ limit }).map((row) => ({ ...clean(row), rank: row.rank }))
    )
  );
}

export function getRecentAccounts({ limit = 5 } = {}) {
  return resolve(
    cacheWrap(`ecosystem:recent:${limit}`, () =>
      demoProvider.getRecentAccounts({ limit }).map((row) => ({ ...clean(row), rank: row.rank }))
    )
  );
}

export function getDashboardStats() {
  return resolve(cacheWrap("ecosystem:dashboard:stats", () => demoProvider.getDashboardStats()));
}

export function getActivityTrend() {
  return resolve(cacheWrap("ecosystem:dashboard:trend", () => demoProvider.getActivityTrend()));
}

export function getPerformanceDistribution() {
  return resolve(cacheWrap("ecosystem:dashboard:distribution", () => demoProvider.getPerformanceDistribution()));
}

export function getCategoryBreakdown() {
  return resolve(cacheWrap("ecosystem:dashboard:categories", () => demoProvider.getCategoryBreakdown()));
}

export function getRecentActivityFeed({ limit = 8 } = {}) {
  return resolve(cacheWrap(`ecosystem:dashboard:feed:${limit}`, () => demoProvider.getRecentActivityFeed({ limit })));
}

export function getCompare(a, b) {
  const result = demoProvider.compareAccounts(a, b);
  if (!result) return resolve(null);
  return resolve({
    a: { ...result.a, account: clean(result.a.account) },
    b: { ...result.b, account: clean(result.b.account) },
  });
}

export function getEcosystemResources() {
  return resolve(cacheWrap("ecosystem:resources", () => demoProvider.getEcosystemResources()));
}