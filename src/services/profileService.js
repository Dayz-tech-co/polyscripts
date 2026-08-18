// Builds the complete public profile bundle for one resolved account:
// overview stats, positions, resolved history, activity, and a performance
// series derived from real activity data. Everything is fetched once per
// profile load and cached, so switching tabs or chart ranges never refetches.

import { provider } from "./providers";
import { cacheGet, cacheSet } from "./cache";
import { NotFoundError } from "./errors";
import { resolveIdentifier, getAccountByAddress, getLeaderboardEntryForAddress } from "./polymarketService";
import { mergeAccounts } from "../adapters/accountAdapter";
import {
  normalizePosition,
  normalizeClosedPosition,
  normalizeActivity,
  deriveStats,
  buildVolumeSeries,
} from "../adapters/profileAdapter";

const BUNDLE_TTL = 45_000;

const RANGE_MS = {
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  "3M": 90 * 24 * 60 * 60 * 1000,
  ALL: null,
};

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

  const performance = Object.fromEntries(
    Object.entries(RANGE_MS).map(([range, ms]) => [range, buildVolumeSeries(activity, ms)])
  );

  const bundle = {
    account: enrichedAccount,
    stats,
    positions,
    resolvedPositions,
    activity,
    performance,
  };

  cacheSet(cacheKey, bundle, BUNDLE_TTL);
  return bundle;
}
