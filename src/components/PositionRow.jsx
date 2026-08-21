import MarketImage from "./MarketImage";
import MarketLink from "./MarketLink";
import { formatCurrency, formatDate, formatNumber, formatPercentage, formatPrice, formatSignedCurrency } from "../utils/formatters";
import { getToneClass } from "../utils/states";

export default function PositionRow({ position, variant = "open" }) {
  const pnlTone = getToneClass(position.pnl);

  return (
    <tr className="position-row">
      <td className="market-cell">
        <MarketImage icon={position.icon} category={position.category} tag={position.tag} size={40} />
        <div className="market-cell-text">
          <span className="market-title" title={position.market}>
            {position.market}
          </span>
          <span className="market-meta">
            {position.category}
            {" · "}
            {variant === "resolved"
              ? `Resolved ${formatDate(position.closeDate)}`
              : `Closes ${formatDate(position.closeDate)}`}
          </span>
        </div>
      </td>
      <td>
        <span className={`side-badge side-${position.side.toLowerCase()}`}>{position.side}</span>
      </td>
      {variant === "open" ? (
        <>
          <td className="num-cell">{formatPrice(position.averagePrice)}</td>
          <td className="num-cell">{formatPrice(position.currentPrice)}</td>
          <td className="num-cell">{position.shares != null ? formatNumber(position.shares) : "N/A"}</td>
          <td className="num-cell">{formatCurrency(position.currentValue)}</td>
          <td className={`num-cell ${pnlTone}`}>{formatSignedCurrency(position.pnl)}</td>
          <td className={`num-cell ${pnlTone}`}>{formatPercentage(position.pnlPercent, { signed: true })}</td>
          <td className="action-cell">
            <MarketLink position={position} iconOnly />
          </td>
        </>
      ) : (
        <>
          <td className="num-cell">{position.shares != null ? formatNumber(position.shares) : "N/A"}</td>
          <td className="num-cell">{formatCurrency(position.invested)}</td>
          <td className="num-cell">{formatCurrency(position.returned)}</td>
          <td className={`num-cell ${pnlTone}`}>{formatSignedCurrency(position.pnl)}</td>
          <td className={`num-cell ${pnlTone}`}>{formatPercentage(position.pnlPercent, { signed: true })}</td>
          <td>
            <span className={`status-pill ${position.pnl != null && position.pnl >= 0 ? "status-won" : "status-lost"}`}>
              {position.pnl != null ? (position.pnl >= 0 ? "Won" : "Lost") : "Resolved"}
            </span>
          </td>
        </>
      )}
    </tr>
  );
}
