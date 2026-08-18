import MarketIcon from "./MarketIcon";
import { formatCurrency, formatDate, formatPrice, formatSignedCurrency } from "../utils/formatters";

export default function PositionCardMobile({ position, variant = "open" }) {
  const pnlTone = position.pnl >= 0 ? "positive" : "negative";

  return (
    <div className="position-card-mobile">
      <div className="position-card-mobile-head">
        <MarketIcon category={position.category} tag={position.tag} />
        <div className="market-cell-text">
          <span className="market-title">{position.market}</span>
          <span className="market-meta">
            {position.category}
            {" · "}
            {variant === "resolved"
              ? `Resolved ${formatDate(position.closeDate)}`
              : `Closes ${formatDate(position.closeDate)}`}
          </span>
        </div>
        <span className={`side-badge side-${position.side.toLowerCase()}`}>{position.side}</span>
      </div>
      <div className="position-card-mobile-grid">
        {variant === "open" ? (
          <>
            <div className="position-card-stat">
              <span className="position-card-stat-label">Value</span>
              <span className="position-card-stat-value">{formatCurrency(position.currentValue)}</span>
            </div>
            <div className="position-card-stat">
              <span className="position-card-stat-label">Current</span>
              <span className="position-card-stat-value">{formatPrice(position.currentPrice)}</span>
            </div>
            <div className="position-card-stat">
              <span className="position-card-stat-label">PnL</span>
              <span className={`position-card-stat-value tone-${pnlTone}`}>{formatSignedCurrency(position.pnl)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="position-card-stat">
              <span className="position-card-stat-label">Invested</span>
              <span className="position-card-stat-value">{formatCurrency(position.invested)}</span>
            </div>
            <div className="position-card-stat">
              <span className="position-card-stat-label">Returned</span>
              <span className="position-card-stat-value">{formatCurrency(position.returned)}</span>
            </div>
            <div className="position-card-stat">
              <span className="position-card-stat-label">PnL</span>
              <span className={`position-card-stat-value tone-${pnlTone}`}>{formatSignedCurrency(position.pnl)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
