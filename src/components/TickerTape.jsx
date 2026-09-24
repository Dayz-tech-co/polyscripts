import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWhaleTrades } from "../services/marketService";
import { formatCompactCurrency, formatPrice } from "../utils/formatters";

const POLL_MS = 30_000;

/** Infinite scrolling strip of the latest large trades, shown under the header. */
export default function TickerTape() {
  const [trades, setTrades] = useState([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getWhaleTrades({ minCash: 5_000, limit: 24, enrich: false, signal: controller.signal })
      .then(setTrades)
      .catch(() => {});
    return () => controller.abort();
  }, [tick]);

  if (trades.length === 0) return <div className="ticker ticker-empty" aria-hidden="true" />;

  const row = trades.map((t) => (
    <Link key={t.id} to={`/market/${encodeURIComponent(t.slug || t.conditionId)}`} className="ticker-item" tabIndex={-1}>
      <span className={`ticker-side is-${t.side === "SELL" ? "sell" : "buy"}`}>{t.side === "SELL" ? "▼" : "▲"}</span>
      <strong>{formatCompactCurrency(t.notional)}</strong>
      <span className="ticker-outcome">{t.outcome}</span>
      <span className="ticker-title">{t.title}</span>
      <span className="ticker-price">@ {formatPrice(t.price)}</span>
    </Link>
  ));

  return (
    <div className="ticker" aria-label="Live large trades">
      <span className="ticker-label"><i className="live-dot" aria-hidden="true" /> LIVE</span>
      <div className="ticker-viewport">
        <div className="ticker-track" style={{ "--ticker-duration": `${Math.max(40, trades.length * 5)}s` }}>
          <div className="ticker-group">{row}</div>
          <div className="ticker-group" aria-hidden="true">{row}</div>
        </div>
      </div>
    </div>
  );
}
