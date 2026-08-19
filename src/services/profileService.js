// Builds the complete public profile bundle for one resolved account:
// overview stats, positions, resolved history and activity. Everything is
// fetched once per profile load and cached, so switching tabs never
// refetches. The performance chart is NOT part of the bundle: each timeframe
// is fetched on demand via getPerformanceRange so switching ranges loads a
// genuinely different historical series instead of reusing one dataset.

import { provider } from "./providers";
import { cacheGet, cacheSet } from "./cache";
import { NotFoundError } from "./errors";
import { resolveIdentifier, getAccountByAddress, getLeaderboardEntryForAddress } from "./polymarketService";
import { mergeAccounts } from "../adapters/accountAdapter";
import { normalizePosition, normalizeClosedPosition, normalizeActivity, deriveStats } from "../adapters/profileAdapter";

const BUNDLE_TTL = 45_000;
const PERF_TTL = 60_000;

const VALID_RANGES = new Set(["1D", "1W", "1M", "3M", "ALL"]);

async function settle(promise) {
  try {
    return await promise;
  } catch {
    return null;
  }
}

/**
 * Resolves an identifier (username or address) and fetches everything
 * needed to render its public profile. Every section derives from this one
 * bundle, so no part of the page can end up mixing data from two accounts.
 */
export async function getAccountProfile(identifier, { signal } = {}) {
  const account = await resolveIdentifier(identifier, { signal });
  const address = account.address;

  const cacheKey = `profile:${address}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const [rawPositions, rawClosed, rawActivity, value, traded, rankEntry, publicProfileAccount] = await Promise.all([
    settle(provider.getPositions(address, { limit: 100, signal })),
    settle(provider.getClosedPositions(address, { limit: 50, signal })),
    settle(provider.getActivity(address, { limit: 500, signal })),
    settle(provider.getValue(address, { signal })),
    settle(provider.getTraded(address, { signal })),
    getLeaderboardEntryForAddress(address, { timePeriod: "ALL", signal }),
    // resolveIdentifier may have come from search/leaderboard, neither of
    // which carries bio/volume/tier - fetch the gamma profile directly too
    // so the account record is as complete as it can be either way.
    settle(getAccountByAddress(address, { signal })),
  ]);

  const enrichedAccount = mergeAccounts(mergeAccounts(account, publicProfileAccount), rankEntry);

  const positions = (rawPositions || []).map(normalizePosition);
  const resolvedPositions = (rawClosed || []).map(normalizeClosedPosition);
  const activity = (rawActivity || [])
    .map(normalizeActivity)
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

  // "Account not found" only after the direct lookups have conclusively
  // returned no usable public data: no identity metadata and no analytics.
  // The demo roster, autocomplete and leaderboard never decide this - an
  // address with activity but no profile still renders under its address.
  // Zero counts/values are treated as "no data", since the public API
  // returns exactly that for addresses it has never seen.
  const hasIdentity = Boolean(account.username || account.displayName || account.bio || account.avatar);
  const hasAnalytics =
    positions.length > 0 ||
    resolvedPositions.length > 0 ||
    activity.length > 0 ||
    (value != null && value > 0) ||
    (traded != null && traded > 0) ||
    rankEntry != null;
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
 * caches it independently. Each range resolves through the active provider,
 * so every timeframe can supply its own historical dataset.
 */
export async function getPerformanceRange(identifier, { range = "1M", signal } = {}) {
  const rangeKey = VALID_RANGES.has(range) ? range : "1M";
  const account = await resolveIdentifier(identifier, { signal });
  const address = account.address;

  const cacheKey = `profile:${address}:perf:${rangeKey}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const data = await provider.getPerformanceRange(address, { range: rangeKey, signal });
  cacheSet(cacheKey, data, PERF_TTL);
  return data;
}
