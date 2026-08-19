// Development-only data-integrity checks. These surface contradictions that
// would indicate a real data bug (the same account reporting different PnL on
// two surfaces, impossible win rates, counts that disagree with the actual
// arrays). In production they do nothing.
//
// Total PnL is defined as Realized + Unrealized from the same fetched
// positions data, so the summary card is always internally consistent.

const PNL_TOLERANCE = 0.01;

export function validateProfileData({ stats, positions, resolvedPositions }) {
  const issues = [];

  if (!stats) return issues;

  const realized = stats.realizedPnl;
  const unrealized = stats.unrealizedPnl;
  const total = stats.pnl;

  if (total != null && realized != null && unrealized != null) {
    const parts = realized + unrealized;
    if (Math.abs(total - parts) > PNL_TOLERANCE) {
      const diff = Math.abs(total - parts);
      issues.push({
        level: "info",
        message: `Total PnL (${total}) differs from Realized + Unrealized (${parts}) by ${diff}. Expected with truncated API history.`,
      });
    }
  }

  if (stats.winRate != null && (stats.winRate < 0 || stats.winRate > 1)) {
    issues.push({ level: "error", message: `Win rate ${stats.winRate} is outside [0, 1].` });
  }

  if (stats.wins != null && stats.losses != null && resolvedPositions) {
    const known = resolvedPositions.filter((p) => p.pnl != null).length;
    if (known > 0 && stats.wins + stats.losses !== known) {
      issues.push({
        level: "error",
        message: `Wins (${stats.wins}) + Losses (${stats.losses}) != resolved positions with PnL (${known}).`,
      });
    }
  }

  if (positions && stats.openPositionsCount != null) {
    const count = positions.length;
    if (count > 0 && count !== stats.openPositionsCount) {
      issues.push({
        level: "info",
        message: `Open positions count (${stats.openPositionsCount}) differs from fetched open positions (${count}).`,
      });
    }
  }

  if (stats.avgWin != null && stats.avgWin < 0) {
    issues.push({ level: "error", message: "Avg Win is negative." });
  }
  if (stats.avgLoss != null && stats.avgLoss > 0) {
    issues.push({ level: "error", message: "Avg Loss is positive." });
  }

  return issues;
}

export function logDataIntegrity(issues) {
  if (!issues || issues.length === 0) return;
  // eslint-disable-next-line no-console
  console.groupCollapsed("%cData integrity check", "font-weight:bold");
  issues.forEach((issue) => {
    if (issue.level === "error") {
      // eslint-disable-next-line no-console
      console.error(issue.message);
    } else {
      // eslint-disable-next-line no-console
      console.info(issue.message);
    }
  });
  // eslint-disable-next-line no-console
  console.groupEnd();
}