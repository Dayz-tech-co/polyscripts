import { formatCurrency, formatNumber, formatSignedCurrency } from "../utils/formatters";
import { getValueState } from "../utils/states";

export default function PortfolioSummary({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="card portfolio-summary">
        <span className="card-label">Account Summary</span>
        <div className="summary-loading" aria-hidden="true" />
      </div>
    );
  }

  const sample = stats.resolvedPositionsCount;
  const sampleLabel = sample ? `Last ${formatNumber(sample)} resolved positions` : "Resolved positions";
  const rows = [
    {
      label: "Total PnL (all time)",
      value: stats.pnl != null ? formatSignedCurrency(stats.pnl) : "N/A",
      tone: getValueState(stats.pnl),
    },
    {
      label: "Settled PnL history",
      value: stats.settledPnl != null ? formatSignedCurrency(stats.settledPnl) : "N/A",
      tone: getValueState(stats.settledPnl),
    },
    {
      label: "Unrealized (open positions)",
      value: stats.unrealizedPnl != null ? formatSignedCurrency(stats.unrealizedPnl) : "N/A",
      tone: getValueState(stats.unrealizedPnl),
    },
    { divider: true },
    { label: "Open positions", value: stats.openPositionsCount != null ? formatNumber(stats.openPositionsCount) : "N/A" },
    { label: "Open position value", value: stats.activePositionsValue != null ? formatCurrency(stats.activePositionsValue) : "N/A" },
    ...(stats.unredeemedCount
      ? [{ label: "Resolved, unredeemed", value: formatNumber(stats.unredeemedCount) }]
      : []),
    { heading: sampleLabel },
    {
      label: "Realized PnL",
      value: stats.realizedPnl != null ? formatSignedCurrency(stats.realizedPnl) : "N/A",
      tone: getValueState(stats.realizedPnl),
    },
    { label: "Winning positions", value: stats.wins != null ? formatNumber(stats.wins) : "N/A" },
    { label: "Losing positions", value: stats.losses != null ? formatNumber(stats.losses) : "N/A" },
    {
      label: "Avg win",
      value: stats.avgWin != null ? formatSignedCurrency(stats.avgWin) : "N/A",
      tone: getValueState(stats.avgWin),
    },
    {
      label: "Avg loss",
      value: stats.avgLoss != null ? formatSignedCurrency(stats.avgLoss) : "N/A",
      tone: getValueState(stats.avgLoss),
    },
    {
      label: "Largest win",
      value: stats.largestWin != null ? formatSignedCurrency(stats.largestWin) : "N/A",
      tone: getValueState(stats.largestWin),
    },
    {
      label: "Largest loss",
      value: stats.largestLoss != null ? formatSignedCurrency(stats.largestLoss) : "N/A",
      tone: getValueState(stats.largestLoss),
    },
    { label: "Avg position size", value: stats.avgPositionSize != null ? formatCurrency(stats.avgPositionSize) : "N/A" },
    { divider: true },
    { label: "Markets traded", value: stats.marketsTraded != null ? formatNumber(stats.marketsTraded) : "N/A" },
    { label: "PnL leaderboard rank", value: stats.rank != null ? `#${formatNumber(stats.rank)}` : "Unranked" },
  ];

  return (
    <div className="card portfolio-summary">
      <span className="card-label">Account Summary</span>
      <div className="summary-list">
        {rows.map((row, i) =>
          row.divider ? (
            <div className="summary-divider" key={`d-${i}`} />
          ) : row.heading ? (
            <div className="summary-heading" key={`h-${i}`}>{row.heading}</div>
          ) : (
            <div className="summary-row" key={row.label}>
              <span className="summary-label">{row.label}</span>
              <span className={`summary-value ${row.tone ? `tone-${row.tone}` : ""}`}>{row.value}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}