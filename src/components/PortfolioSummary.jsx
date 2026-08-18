import { formatCurrency, formatPercentage, formatSignedCurrency } from "../utils/formatters";

export default function PortfolioSummary({ summary, loading }) {
  if (loading || !summary) {
    return (
      <div className="card portfolio-summary">
        <span className="card-label">Account Summary</span>
        <div className="summary-loading" aria-hidden="true" />
      </div>
    );
  }

  const rows = [
    { label: "Available Balance", value: formatCurrency(summary.availableBalance) },
    { label: "Open Position Value", value: formatCurrency(summary.openPositionValue) },
    { divider: true },
    { label: "Realized PnL", value: formatSignedCurrency(summary.realizedPnl), tone: summary.realizedPnl >= 0 ? "positive" : "negative" },
    { label: "Unrealized PnL", value: formatSignedCurrency(summary.unrealizedPnl), tone: summary.unrealizedPnl >= 0 ? "positive" : "negative" },
    { divider: true },
    { label: "Total Markets", value: summary.totalMarkets },
    { label: "Win Rate", value: formatPercentage(summary.winRate) },
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
