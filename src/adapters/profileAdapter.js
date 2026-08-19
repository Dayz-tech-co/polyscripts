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
    id: `${raw.conditionId || raw.asset}-${raw.asset || "open"}-open`,
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
    realizedPnl: raw.realizedPnl ?? null,
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
    id: `${raw.conditionId || raw.asset}-${raw.asset || "closed"}-closed-${raw.timestamp ?? ""}`,
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
    id: raw.transactionHash
      ? `${raw.transactionHash}-${raw.asset || raw.conditionId || "event"}-${raw.side || "x"}-${raw.timestamp ?? ""}`
      : `${raw.conditionId || "event"}-${raw.timestamp}-${raw.side || "x"}`,
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
 * Sums only the values that genuinely exist; returns null when nothing does.
 * This keeps a strict "0 vs N/A" discipline: an account with zero winning
 * positions reports 0, while an account whose PnL fields are missing reports
 * N/A instead of a fabricated zero.
 */
function sumNotNull(values) {
  const nums = values.filter((v) => v != null && Number.isFinite(v));
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : null;
}

/**
 * Derives whatever overview statistics can genuinely be computed from the
 * fetched data. Any input list/value that is missing simply leaves the
 * corresponding stat as null instead of being estimated.
 *
 * When a canonical account record carries authoritative stats (e.g. gamma
 * profile fields or the leaderboard entry), those are preferred so the
 * profile never contradicts the leaderboard or comparison surfaces.
 */
export function deriveStats({ positions, closedPositions, value, traded, rankEntry, publicProfile, account }) {
  const canonical = account || publicProfile || null;
  const hasPositions = Array.isArray(positions);
  const hasClosed = Array.isArray(closedPositions);

  const derivedUnrealizedPnl = hasPositions ? sumNotNull(positions.map((p) => p.pnl)) : null;
  const derivedRealizedPnl = hasClosed ? sumNotNull(closedPositions.map((p) => p.pnl)) : null;

  const unrealizedPnl = canonical?.unrealizedPnl ?? derivedUnrealizedPnl;
  const realizedPnl = canonical?.realizedPnl ?? derivedRealizedPnl;
  // Total PnL is always the net of the same realized + unrealized windows so
  // the summary is internally consistent (Total = Realized + Unrealized) and
  // traces to the exact account's positions data. The leaderboard's all-time
  // PnL is intentionally not used here - it reflects a different scope.
  const pnl = unrealizedPnl != null || realizedPnl != null ? (unrealizedPnl ?? 0) + (realizedPnl ?? 0) : null;

  // Invested basis only counts records that carry a real cost, so pnlPercent
  // is never skewed by positions with missing numbers.
  const investedRecords = [];
  if (hasPositions) investedRecords.push(...positions.filter((p) => p.invested != null));
  if (hasClosed) investedRecords.push(...closedPositions.filter((p) => p.invested != null));
  const investedBasis = sumNotNull(investedRecords.map((p) => p.invested)) ?? 0;
  const pnlPercent = pnl != null && investedBasis > 0 ? pnl / investedBasis : null;

  const openPositionValue = hasPositions ? sumNotNull(positions.map((p) => p.currentValue)) : null;
  const portfolioValue = canonical?.portfolioValue ?? value ?? openPositionValue;

  // Win/loss analytics over resolved positions with a known PnL. Zero wins or
  // zero losses are legitimate numbers; missing PnL fields leave them as N/A.
  let wins = null;
  let losses = null;
  let avgWin = null;
  let avgLoss = null;
  let largestWin = null;
  let largestLoss = null;
  if (hasClosed) {
    const known = closedPositions.filter((p) => p.pnl != null && Number.isFinite(p.pnl));
    if (known.length > 0) {
      const winPnl = known.filter((p) => p.pnl >= 0).map((p) => p.pnl);
      const lossPnl = known.filter((p) => p.pnl < 0).map((p) => p.pnl);
      wins = winPnl.length;
      losses = lossPnl.length;
      const winSum = sumNotNull(winPnl);
      const lossSum = sumNotNull(lossPnl);
      avgWin = wins > 0 && winSum != null ? winSum / wins : null;
      avgLoss = losses > 0 && lossSum != null ? lossSum / losses : null;
      largestWin = wins > 0 ? Math.max(...winPnl) : null;
      largestLoss = losses > 0 ? Math.min(...lossPnl) : null;
    }
  }
  const derivedWinRate = wins != null || losses != null ? wins / (wins + losses) : null;
  const winRate = canonical?.winRate ?? derivedWinRate;

  const avgPositionSize = investedRecords.length > 0 && investedBasis != null ? investedBasis / investedRecords.length : null;

  // Volume prefers the leaderboard's raw trading volume over gamma's
  // weightedVolume, which can read 0 (or far smaller) for active accounts.
  const volume = rankEntry?.volume ?? canonical?.volume ?? publicProfile?.volume ?? null;

  return {
    portfolioValue,
    pnl,
    totalPnl: pnl,
    pnlPercent,
    volume,
    marketsTraded: canonical?.markets ?? traded ?? null,
    winRate,
    wins,
    losses,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    avgPositionSize,
    openPositionsCount: canonical?.openPositions ?? (hasPositions ? positions.length : null),
    activityCount: canonical?.activityCount ?? null,
    resolvedPositionsCount: hasClosed ? closedPositions.length : null,
    realizedPnl,
    unrealizedPnl,
    openPositionValue,
    rank: rankEntry?.rank ?? null,
  };
}
