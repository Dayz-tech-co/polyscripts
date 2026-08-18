import { formatCurrency, formatNumber, formatPercentage, formatSignedCurrency } from "../utils/formatters";

export default function PortfolioSummary({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="card portfolio-summary">
        <span className="card-label">Account Summary</span>
        <div className="summary-loading" aria-hidden="true" />
      </div>
    );
  }

  const rows = [
    { label: "Open Position Value", value: stats.openPositionValue != null ? formatCurrency(stats.openPositionValue) : "--" },
    { label: "Open Positions", value: stats.openPositionsCount != null ? formatNumber(stats.openPositionsCount) : "--" },
    { divider: true },
    {
      label: "Realized PnL",
      value: stats.realizedPnl != null ? formatSignedCurrency(stats.realizedPnl) : "--",
      tone: stats.realizedPnl != null ? (stats.realizedPnl >= 0 ? "positive" : "negative") : undefined,
    },
    {
      label: "Unrealized PnL",
      value: stats.unrealizedPnl != null ? formatSignedCurrency(stats.unrealizedPnl) : "--",
      tone: stats.unrealizedPnl != null ? (stats.unrealizedPnl >= 0 ? "positive" : "negative") : undefined,
    },
    { divider: true },
    { label: "Markets Traded", value: stats.marketsTraded != null ? formatNumber(stats.marketsTraded) : "--" },
    { label: "Win Rate", value: stats.winRate != null ? formatPercentage(stats.winRate) : "--" },
    { label: "Leaderboard Rank", value: stats.rank != null ? `#${formatNumber(stats.rank)}` : "Unranked" },
  ];

  return (
    <div className="card portfolio-summary">
      <span className="card-label">Account Summary</span>
      <div className="summary-list">
        {rows.map((row, i) =>
          row.divider ? (
            <div className="summary-divider" key={`d-${i}`} />
          ) : (
            <div className="summary-row" key={row.label}>
              <span className="summary-label">{row.label}</span>
              <span className={`summary-value ${row.tone ? `tone-${row.tone}` : ""}`}>{row.value}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
