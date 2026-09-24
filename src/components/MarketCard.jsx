import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MarketImage from "./MarketImage";
import { formatCompactCurrency, formatEndsIn, formatPrice, formatPriceChange } from "../utils/formatters";
import { getToneClass } from "../utils/states";

/** Market summary card: leading outcome price, 24h move, volume, liquidity. */
/** Flashes green/red when a live price moves between refreshes. */
function usePriceFlash(price) {
  const prev = useRef(price);
  const [flash, setFlash] = useState("");
  useEffect(() => {
    if (prev.current != null && price != null && price !== prev.current) {
      setFlash(price > prev.current ? "flash-up" : "flash-down");
      const id = setTimeout(() => setFlash(""), 1400);
      prev.current = price;
      return () => clearTimeout(id);
    }
    prev.current = price;
    return undefined;
  }, [price]);
  return flash;
}

export default function MarketCard({ market, index = 0 }) {
  const [first, second] = market.outcomes;
  const flash = usePriceFlash(first?.price);
  const ends = formatEndsIn(market.endDate);
  return (
    <Link to={`/market/${encodeURIComponent(market.slug || market.conditionId)}`} className={`market-card ${flash}`} style={{ "--i": Math.min(index, 14) }}>
      <div className="market-card-top">
        <MarketImage icon={market.icon} tag={market.question.slice(0, 3).toUpperCase()} size={36} />
        <span className="market-card-title">{market.question}</span>
      </div>
      <div className="market-card-outcomes">
        {[first, second].filter(Boolean).map((o) => (
          <span key={o.index} className={`market-outcome is-${o.index === 0 ? "a" : "b"}`}>
            <span>{o.name}</span>
            <strong>{formatPrice(o.price)}</strong>
          </span>
        ))}
      </div>
      <div className="market-card-meta">
        <span className={getToneClass(market.change1d)}>{formatPriceChange(market.change1d)} 24h</span>
        <span>{formatCompactCurrency(market.volume24h)} vol</span>
        {market.rewardsDaily ? <span className="market-card-reward">{formatCompactCurrency(market.rewardsDaily)}/day rewards</span> : ends ? <span>{ends}</span> : null}
      </div>
    </Link>
  );
}
