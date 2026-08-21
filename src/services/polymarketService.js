// Account discovery + identity resolution. This is the only layer that
// talks to the active data provider for search/leaderboard/lookup calls -
// UI components and hooks always go through the functions below.

import { provider } from "./providers";
import { cacheGet, cacheSet } from "./cache";
import { normalizeProfile, normalizeLeaderboardEntry, dedupeAccounts, mergeAccounts } from "../adapters/accountAdapter";
import { isValidAddress, looksLikeAddressInput, normalizeAddress } from "../utils/address";
import { NotFoundError } from "./errors";

const SEARCH_TTL = 30_000;
const ACCOUNT_TTL = 60_000;
const LEADERBOARD_TTL = 45_000;

function matchScore(account, query) {
  const q = query.toLowerCase();
  const name = (account.username || "").toLowerCase();
  if (name === q) return 0;
  if (name.startsWith(q)) return 1;
  return 2;
}

/**
 * Searches for public accounts by username or wallet address. Returns an
 * empty array for empty/too-short/incomplete-address input rather than
 * hitting the network.
 */
export async function searchAccounts(query, { signal } = {}) {
  const trimmed = (query || "").trim();
  if (!trimmed) return [];

  if (isValidAddress(trimmed)) {
    const account = await getAccountByAddress(normalizeAddress(trimmed), { signal });
    return account ? [account] : [];
  }

  // A partial "0x..." string can never match a username - avoid a wasted
  // request and let the caller show a "keep typing an address" hint instead.
  if (looksLikeAddressInput(trimmed)) return [];

  if (trimmed.length < 2) return [];

  const cacheKey = `search:${trimmed.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const raw = await provider.searchProfiles(trimmed, { limit: 8, signal });
  const accounts = dedupeAccounts(raw.map(normalizeProfile)).filter((a) => a.address);
  accounts.sort((a, b) => matchScore(a, trimmed) - matchScore(b, trimmed));
  const results = accounts.slice(0, 8);

  cacheSet(cacheKey, results, SEARCH_TTL);
  return results;
}

export async function getAccountByAddress(address, { signal } = {}) {
  const normalized = normalizeAddress(address);
  if (!isValidAddress(normalized)) return null;

  const cacheKey = `account:${normalized}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const raw = await provider.getPublicProfileByAddress(normalized, { signal });

  // The roster/search/leaderboard lists are discovery mechanisms, not the
  // source of truth for whether an address exists. A wallet without a gamma
  // profile still resolves - identity simply falls back to the address
  // itself. Whether it has any usable public data is decided downstream in
  // getAccountProfile once the public analytics endpoints have answered.
  const account = raw
    ? { ...normalizeProfile(raw), address: normalized }
    : {
        id: normalized,
        username: null,
        displayName: null,
        address: normalized,
        avatar: null,
        rank: null,
        volume: null,
        pnl: null,
        verified: null,
        bio: null,
        xUsername: null,
        tier: null,
        tierName: null,
      };

  cacheSet(cacheKey, account, ACCOUNT_TTL);
  return account;
}

export async function getAccountByUsername(username, { signal } = {}) {
  const trimmed = (username || "").trim();
  if (!trimmed) return null;

  const cacheKey = `account:username:${trimmed.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const profiles = await provider.searchProfiles(trimmed, { limit: 8, signal });
  const exact = profiles.find((p) => (p.name || "").toLowerCase() === trimmed.toLowerCase());
  if (exact) {
    const partial = normalizeProfile(exact);
    // Search omits live takerTier — hydrate from public-profile by address.
    if (partial?.address) {
      const full = await getAccountByAddress(partial.address, { signal });
      const account = full
        ? {
            ...mergeAccounts(partial, full),
            tier: full.tier ?? partial.tier ?? null,
            tierName: full.tierName ?? partial.tierName ?? null,
          }
        : partial;
      cacheSet(cacheKey, account, ACCOUNT_TTL);
      return account;
    }
    cacheSet(cacheKey, partial, ACCOUNT_TTL);
    return partial;
  }

  // Fall back to an exact leaderboard username filter in case the account
  // hasn't been indexed by profile search yet.
  const entries = await provider.getLeaderboard({ userName: trimmed, limit: 1, signal });
  if (entries[0]) {
    const account = normalizeLeaderboardEntry(entries[0]);
    cacheSet(cacheKey, account, ACCOUNT_TTL);
    return account;
  }

  return null;
}

/**
 * Resolves whatever a visitor typed or navigated to (username or address)
 * into a single canonical account record. Throws NotFoundError when
 * nothing public matches.
 */
export async function resolveIdentifier(identifier, { signal } = {}) {
  const trimmed = (identifier || "").trim();
  if (!trimmed) throw new NotFoundError();

  const account = isValidAddress(trimmed)
    ? await getAccountByAddress(trimmed, { signal })
    : await getAccountByUsername(trimmed, { signal });

  if (!account) throw new NotFoundError();
  return account;
}

const VALID_TIME_PERIODS = new Set(["DAY", "WEEK", "MONTH", "ALL"]);
const VALID_ORDER_BY = new Set(["PNL", "VOL"]);

export async function getTopAccounts({ timePeriod = "DAY", orderBy = "PNL", limit = 8, signal } = {}) {
  const period = VALID_TIME_PERIODS.has(timePeriod) ? timePeriod : "DAY";
  const order = VALID_ORDER_BY.has(orderBy) ? orderBy : "PNL";

  const cacheKey = `leaderboard:${period}:${order}:${limit}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const raw = await provider.getLeaderboard({ category: "OVERALL", timePeriod: period, orderBy: order, limit, signal });
  const accounts = raw.map(normalizeLeaderboardEntry).filter((a) => a.address);

  cacheSet(cacheKey, accounts, LEADERBOARD_TTL);
  return accounts;
}

/** Best-effort rank/volume/pnl lookup for a single address, non-fatal on failure. */
export async function getLeaderboardEntryForAddress(address, { timePeriod = "ALL", signal } = {}) {
  try {
    const entries = await provider.getLeaderboard({ category: "OVERALL", timePeriod, orderBy: "PNL", user: address, limit: 1, signal });
    return entries[0] ? normalizeLeaderboardEntry(entries[0]) : null;
  } catch {
    return null;
  }
}
