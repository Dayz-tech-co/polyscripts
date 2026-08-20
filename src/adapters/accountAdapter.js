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
    tierName: raw.takerTierName ?? null,
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
