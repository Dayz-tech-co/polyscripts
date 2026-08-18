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

  const rows = [
    { label: "Open Position Value", value: stats.openPositionValue != null ? formatCurrency(stats.openPositionValue) : "--" },
    { label: "Open Positions", value: stats.openPositionsCount != null ? formatNumber(stats.openPositionsCount) : "--" },
    { divider: true },
    {
      label: "Realized PnL",
      value: stats.realizedPnl != null ? formatSignedCurrency(stats.realizedPnl) : "--",
      tone: getValueState(stats.realizedPnl),
    },
    {
      label: "Unrealized PnL",
      value: stats.unrealizedPnl != null ? formatSignedCurrency(stats.unrealizedPnl) : "--",
      tone: getValueState(stats.unrealizedPnl),
    },
    { divider: true },
    { label: "Activity Count", value: stats.activityCount != null ? formatNumber(stats.activityCount) : "--" },
    { label: "Markets", value: stats.marketsTraded != null ? formatNumber(stats.marketsTraded) : "--" },
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