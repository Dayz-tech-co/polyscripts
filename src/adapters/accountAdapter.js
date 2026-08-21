// Normalizes account records coming from different public Polymarket
// sources (profile search, public profile lookup, leaderboard) into one
// internal shape so the UI never needs to know where a result came from.
//
// Internal account shape:
// { id, username, displayName, address, avatar, rank, volume, pnl, verified, bio }
//
// Only fields that genuinely exist in the source data are populated;
// everything else is null.

import { normalizeAddress } from "../utils/address";

const PLACEHOLDER_USERNAME_RE = /^0x[0-9a-fA-F]{40}-\d+$/;

/** Official Polymarket taker rebate tiers (docs: trading/taker-rebates). */
export const POLYMARKET_TIER_NAMES = [
  "Tier 0", // API label for level 0 / None
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Obsidian",
];

/** Resolve live taker tier from gamma public-profile fields. */
export function resolveTakerTier(raw) {
  if (!raw) return { tier: null, tierName: null };

  const tierNum =
    raw.takerTier != null && Number.isFinite(Number(raw.takerTier)) ? Number(raw.takerTier) : null;

  if (tierNum != null && tierNum >= 0 && tierNum < POLYMARKET_TIER_NAMES.length) {
    return { tier: tierNum, tierName: POLYMARKET_TIER_NAMES[tierNum] };
  }

  const fromName = raw.takerTierName != null ? String(raw.takerTierName).trim() : "";
  if (fromName) {
    const namedIdx = POLYMARKET_TIER_NAMES.findIndex(
      (n) => n.toLowerCase() === fromName.toLowerCase() || (n === "Tier 0" && /^tier\s*0$/i.test(fromName)),
    );
    if (namedIdx >= 0) return { tier: namedIdx, tierName: POLYMARKET_TIER_NAMES[namedIdx] };
    return { tier: null, tierName: fromName };
  }

  return { tier: null, tierName: null };
}

/** Some public sources return an auto-generated "address-timestamp" string
 * in place of a real chosen username. Treat that as "no username" rather
 * than inventing an identity for the account. */
function isPlaceholderUsername(name) {
  return typeof name === "string" && PLACEHOLDER_USERNAME_RE.test(name);
}

function pickAvatar(raw) {
  return raw.profileImage || raw.profileImageOptimized?.imageUrlOptimized || null;
}

/**
 * Normalizes a profile record from gamma-api's /public-search or
 * /public-profile endpoints.
 */
export function normalizeProfile(raw) {
  if (!raw) return null;
  const address = normalizeAddress(raw.proxyWallet);
  const usernamePublic = raw.displayUsernamePublic !== false;
  const rawName = usernamePublic ? raw.name : null;
  const username = rawName && !isPlaceholderUsername(rawName) ? rawName : null;
  const displayName = username || raw.pseudonym || null;
  const { tier, tierName } = resolveTakerTier(raw);

  return {
    id: address || username || raw.id || null,
    username,
    displayName,
    address,
    avatar: pickAvatar(raw),
    rank: null,
    volume: raw.weightedVolume ?? null,
    pnl: raw.pnl ?? null,
    winRate: raw.winRate ?? null,
    markets: raw.markets ?? null,
    portfolioValue: raw.portfolioValue ?? null,
    openPositions: raw.openPositions ?? null,
    activityCount: raw.activityCount ?? null,
    realizedPnl: raw.realizedPnl ?? null,
    unrealizedPnl: raw.unrealizedPnl ?? null,
    verified: raw.verifiedBadge ?? null,
    bio: raw.bio ?? null,
    tier,
    tierName,
  };
}

/**
 * Normalizes one row from data-api's /v1/leaderboard endpoint.
 */
export function normalizeLeaderboardEntry(raw) {
  if (!raw) return null;
  const address = normalizeAddress(raw.proxyWallet || raw.user || raw.address);
  const username = raw.userName && !isPlaceholderUsername(raw.userName) ? raw.userName : null;

  return {
    id: address,
    username,
    displayName: username,
    address,
    avatar: raw.profileImage || null,
    rank: raw.rank != null ? Number(raw.rank) : null,
    volume: raw.vol ?? null,
    pnl: raw.pnl ?? null,
    winRate: raw.winRate ?? null,
    markets: raw.markets ?? null,
    portfolioValue: null,
    openPositions: null,
    activityCount: null,
    realizedPnl: null,
    unrealizedPnl: null,
    verified: raw.verifiedBadge ?? null,
    bio: null,
    tier: null,
    tierName: null,
  };
}

/**
 * Merges two normalized account records for the same address, preferring
 * whichever side actually has a value for each field. Useful when a
 * leaderboard row and a public profile both describe the same account.
 */
export function mergeAccounts(base, extra) {
  if (!base) return extra;
  if (!extra) return base;
  const merged = { ...base };
  for (const key of Object.keys(extra)) {
    if (merged[key] === null || merged[key] === undefined) {
      merged[key] = extra[key];
    }
  }
  return merged;
}

/**
 * Deduplicates a list of normalized accounts by address (falling back to
 * username), keeping the richest merged record for each identity.
 */
export function dedupeAccounts(accounts) {
  const byKey = new Map();
  const order = [];
  for (const account of accounts) {
    if (!account) continue;
    const key = account.address || account.username;
    if (!key) continue;
    if (byKey.has(key)) {
      byKey.set(key, mergeAccounts(byKey.get(key), account));
    } else {
      byKey.set(key, account);
      order.push(key);
    }
  }
  return order.map((key) => byKey.get(key));
}
