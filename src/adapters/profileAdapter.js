// Normalizes account detail records (positions, closed positions, activity)
// from data-api into the shapes the profile UI components already expect,
// and derives summary statistics purely from values that genuinely exist in
// the source data. Nothing here invents a number - unavailable metrics are
// left as null and the UI is expected to omit them gracefully.

function round2(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value * 100) / 100 : value;
}

function shortTag(slug, title) {
  const source = slug || title || "";
  const cleaned = source.replace(/^0x[a-f0-9-]+/i, "").replace(/[^a-zA-Z0-9]/g, "");
  return cleaned ? cleaned.slice(0, 3).toUpperCase() : "MKT";
}

function sideFromOutcome(outcome) {
  if (!outcome) return "YES";
  const lower = outcome.toLowerCase();
  if (lower === "yes") return "YES";
  if (lower === "no") return "NO";
  return outcome;
}

/** Open position from GET /positions */
export function normalizePosition(raw) {
  const invested = raw.initialValue ?? (raw.avgPrice != null && raw.size != null ? raw.avgPrice * raw.size : null);
  return {
    id: `${raw.conditionId || raw.asset}-open`,
    market: raw.title || "Unknown market",
    category: raw.category ?? null,
    tag: shortTag(raw.slug, raw.title),
    side: sideFromOutcome(raw.outcome),
    outcomeIndex: raw.outcomeIndex ?? null,
    averagePrice: raw.avgPrice ?? null,
    currentPrice: raw.curPrice ?? null,
    shares: raw.size ?? null,
    invested: invested != null ? round2(invested) : null,
    currentValue: raw.currentValue ?? null,
    pnl: raw.cashPnl ?? null,
    pnlPercent: raw.percentPnl != null ? raw.percentPnl / 100 : null,
    status: "open",
    closeDate: raw.endDate ?? null,
    slug: raw.slug ?? null,
    icon: raw.icon ?? null,
  };
}

/** Resolved position from GET /closed-positions */
export function normalizeClosedPosition(raw) {
  const invested = raw.avgPrice != null && raw.totalBought != null ? round2(raw.avgPrice * raw.totalBought) : null;
  const realizedPnl = raw.realizedPnl ?? null;
  const returned = invested != null && realizedPnl != null ? round2(invested + realizedPnl) : null;
  return {
    id: `${raw.conditionId || raw.asset}-closed-${raw.timestamp ?? ""}`,
    market: raw.title || "Unknown market",
    category: raw.category ?? null,
    tag: shortTag(raw.slug, raw.title),
    side: sideFromOutcome(raw.outcome),
    outcomeIndex: raw.outcomeIndex ?? null,
    averagePrice: raw.avgPrice ?? null,
    shares: raw.totalBought ?? null,
    invested,
    returned,
    currentValue: returned,
    pnl: realizedPnl,
    pnlPercent: invested && realizedPnl != null ? realizedPnl / invested : null,
    status: "resolved",
    outcome: realizedPnl != null && realizedPnl >= 0 ? "won" : "lost",
    closeDate: raw.timestamp ? new Date(raw.timestamp * 1000).toISOString() : null,
    slug: raw.slug ?? null,
    icon: raw.icon ?? null,
  };
}

const ACTIVITY_TYPE_LABELS = {
  TRADE_BUY: "Bought",
  TRADE_SELL: "Sold",
  REDEEM: "Redeemed",
  MERGE: "Merged",
  SPLIT: "Split",
  REWARD: "Reward",
  CONVERSION: "Converted",
  DEPOSIT: "Deposited",
  WITHDRAWAL: "Withdrew",
};

function activityTypeLabel(type, side) {
  if (type === "TRADE") return side === "SELL" ? "Sold" : "Bought";
  return ACTIVITY_TYPE_LABELS[type] || (type ? type.charAt(0) + type.slice(1).toLowerCase() : "Activity");
}

/** One entry from GET /activity */
export function normalizeActivity(raw) {
  return {
    id: raw.transactionHash ? `${raw.transactionHash}-${raw.asset || ""}` : `${raw.conditionId}-${raw.timestamp}`,
    type: activityTypeLabel(raw.type, raw.side),
    rawType: raw.type,
    market: raw.title || "Unknown market",
    category: raw.category ?? null,
    side: sideFromOutcome(raw.outcome),
    amount: raw.usdcSize ?? null,
    price: raw.price ?? null,
    shares: raw.size ?? null,
    timestamp: raw.timestamp ? raw.timestamp * 1000 : null,
    slug: raw.slug ?? null,
    icon: raw.icon ?? null,
  };
}

/**
 * Derives whatever overview statistics can genuinely be computed from the
 * fetched data. Any input list/value that is missing simply leaves the
 * corresponding stat as null instead of being estimated.
 *
 * When a canonical account record carries authoritative stats (demo data,
 * or a future provider that exposes them directly), those are preferred so
 * the profile never contradicts the leaderboard or comparison surfaces.
 */
export function deriveStats({ positions, closedPositions, value, traded, rankEntry, publicProfile, account }) {
  const canonical = account || publicProfile || null;
  const hasPositions = Array.isArray(positions);
  const hasClosed = Array.isArray(closedPositions);

  const derivedUnrealizedPnl = hasPositions ? positions.reduce((sum, p) => sum + (p.pnl ?? 0), 0) : null;
  const derivedRealizedPnl = hasClosed ? closedPositions.reduce((sum, p) => sum + (p.pnl ?? 0), 0) : null;

  const unrealizedPnl = canonical?.unrealizedPnl ?? derivedUnrealizedPnl;
  const realizedPnl = canonical?.realizedPnl ?? derivedRealizedPnl;
  const pnl = canonical?.pnl ?? (unrealizedPnl != null || realizedPnl != null ? (unrealizedPnl ?? 0) + (realizedPnl ?? 0) : null);

  const investedBasis =
    (hasPositions ? positions.reduce((sum, p) => sum + (p.invested ?? 0), 0) : 0) +
    (hasClosed ? closedPositions.reduce((sum, p) => sum + (p.invested ?? 0), 0) : 0);
  const pnlPercent = pnl != null && investedBasis > 0 ? pnl / investedBasis : null;

  const openPositionValue = hasPositions ? positions.reduce((sum, p) => sum + (p.currentValue ?? 0), 0) : null;
  const portfolioValue = canonical?.portfolioValue ?? value ?? openPositionValue;

  const derivedWins = hasClosed ? closedPositions.filter((p) => (p.pnl ?? 0) >= 0).length : null;
  const derivedWinRate = hasClosed && closedPositions.length > 0 ? derivedWins / closedPositions.length : null;
  const winRate = canonical?.winRate ?? derivedWinRate;

  const volume = canonical?.volume ?? publicProfile?.volume ?? rankEntry?.volume ?? null;

  return {
    portfolioValue,
    pnl,
    pnlPercent,
    volume,
    marketsTraded: canonical?.markets ?? traded ?? null,
    winRate,
    openPositionsCount: canonical?.openPositions ?? (hasPositions ? positions.length : null),
    activityCount: canonical?.activityCount ?? null,
    resolvedPositionsCount: hasClosed ? closedPositions.length : null,
    realizedPnl,
    unrealizedPnl,
    openPositionValue,
    rank: rankEntry?.rank ?? null,
  };
}
