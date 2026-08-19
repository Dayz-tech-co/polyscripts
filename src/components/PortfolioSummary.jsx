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
    {
      label: "Total PnL",
      value: stats.pnl != null ? formatSignedCurrency(stats.pnl) : "N/A",
      tone: getValueState(stats.pnl),
    },
    { label: "Open Position Value", value: stats.openPositionValue != null ? formatCurrency(stats.openPositionValue) : "N/A" },
    { label: "Open Positions", value: stats.openPositionsCount != null ? formatNumber(stats.openPositionsCount) : "N/A" },
    { divider: true },
    {
      label: "Realized PnL",
      value: stats.realizedPnl != null ? formatSignedCurrency(stats.realizedPnl) : "N/A",
      tone: getValueState(stats.realizedPnl),
    },
    {
      label: "Unrealized PnL",
      value: stats.unrealizedPnl != null ? formatSignedCurrency(stats.unrealizedPnl) : "N/A",
      tone: getValueState(stats.unrealizedPnl),
    },
    { divider: true },
    { label: "Winning Positions", value: stats.wins != null ? formatNumber(stats.wins) : "N/A" },
    { label: "Losing Positions", value: stats.losses != null ? formatNumber(stats.losses) : "N/A" },
    {
      label: "Avg Win",
      value: stats.avgWin != null ? formatSignedCurrency(stats.avgWin) : "N/A",
      tone: getValueState(stats.avgWin),
    },
    {
      label: "Avg Loss",
      value: stats.avgLoss != null ? formatSignedCurrency(stats.avgLoss) : "N/A",
      tone: getValueState(stats.avgLoss),
    },
    {
      label: "Largest Win",
      value: stats.largestWin != null ? formatSignedCurrency(stats.largestWin) : "N/A",
      tone: getValueState(stats.largestWin),
    },
    {
      label: "Largest Loss",
      value: stats.largestLoss != null ? formatSignedCurrency(stats.largestLoss) : "N/A",
      tone: getValueState(stats.largestLoss),
    },
    { label: "Avg Position Size", value: stats.avgPositionSize != null ? formatCurrency(stats.avgPositionSize) : "N/A" },
    { divider: true },
    { label: "Activity Count", value: stats.activityCount != null ? formatNumber(stats.activityCount) : "N/A" },
    { label: "Markets", value: stats.marketsTraded != null ? formatNumber(stats.marketsTraded) : "N/A" },
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
          ),
        )}
      </div>
    </div>
  );
}