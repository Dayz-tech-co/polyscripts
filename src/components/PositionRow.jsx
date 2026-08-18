import { ExternalLink } from "lucide-react";
import MarketIcon from "./MarketIcon";
import { formatCurrency, formatDate, formatPrice, formatSignedCurrency } from "../utils/formatters";

export default function PositionRow({ position, variant = "open" }) {
  const pnlTone = position.pnl >= 0 ? "positive" : "negative";

  return (
    <tr className="position-row">
      <td className="market-cell">
        <MarketIcon category={position.category} tag={position.tag} />
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
          <td className="num-cell">{formatCurrency(position.currentValue)}</td>
          <td className={`num-cell tone-${pnlTone}`}>{formatSignedCurrency(position.pnl)}</td>
          <td className="action-cell">
            <button type="button" className="icon-btn icon-btn-sm" aria-label={`Open ${position.market}`}>
              <ExternalLink size={14} aria-hidden="true" />
            </button>
          </td>
        </>
      ) : (
        <>
          <td className="num-cell">{formatCurrency(position.invested)}</td>
          <td className="num-cell">{formatCurrency(position.returned)}</td>
          <td className={`num-cell tone-${pnlTone}`}>{formatSignedCurrency(position.pnl)}</td>
          <td className="num-cell text-muted">{formatDate(position.closeDate)}</td>
        </>
      )}
    </tr>
  );
}
