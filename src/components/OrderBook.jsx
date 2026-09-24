import { useEffect, useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { Skeleton } from "./Skeleton";
import { getOrderBook } from "../services/marketService";
import { formatCompactCurrency, formatNumber } from "../utils/formatters";

const POLL_MS = 5_000;

function cents(p) {
  return p == null ? "N/A" : `${(p * 100).toFixed(1)}¢`;
}

function Side({ levels, kind, maxTotal, changed }) {
  return (
    <div className={`book-side is-${kind}`}>
      <div className="book-head"><span>Price</span><span>Shares</span><span>Total</span></div>
      {levels.map((l) => (
        <div key={l.price} className={`book-row ${changed.has(`${kind}${l.price}`) ? "is-changed" : ""}`}>
          <i className="book-depth" style={{ width: `${(l.total / maxTotal) * 100}%` }} aria-hidden="true" />
          <span className="book-price">{cents(l.price)}</span>
          <span>{formatNumber(Math.round(l.size))}</span>
          <span>{formatCompactCurrency(l.total)}</span>
        </div>
      ))}
      {levels.length === 0 && <div className="book-empty">No {kind === "bid" ? "bids" : "asks"}</div>}
    </div>
  );
}

/** Live CLOB order book with cumulative depth bars; refreshes every 5s. */
export default function OrderBook({ tokenId, outcomeName }) {
  const [book, setBook] = useState(null);
  const [error, setError] = useState(false);
  const [changed, setChanged] = useState(() => new Set());
  const prev = useRef(new Map());

  useEffect(() => {
    if (!tokenId) return undefined;
    let controller;
    let alive = true;
    prev.current = new Map();
    setBook(null);
    async function load() {
      if (document.visibilityState !== "visible") return;
      controller?.abort();
      controller = new AbortController();
      try {
        const next = await getOrderBook(tokenId, { signal: controller.signal });
        if (!alive || !next) return;
        const diff = new Set();
        const seen = new Map();
        for (const [kind, rows] of [["bid", next.bids], ["ask", next.asks]]) {
          for (const r of rows) {
            const key = `${kind}${r.price}`;
            seen.set(key, r.size);
            if (prev.current.size && prev.current.get(key) !== r.size) diff.add(key);
          }
        }
        prev.current = seen;
        setChanged(diff);
        setBook(next);
        setError(false);
      } catch (err) {
        if (err?.name !== "AbortError" && alive) setError(true);
      }
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
      controller?.abort();
    };
  }, [tokenId]);

  const maxTotal = book ? Math.max(1, book.bids.at(-1)?.total || 0, book.asks.at(-1)?.total || 0) : 1;

  return (
    <section className="card order-book" aria-labelledby="order-book-title" data-reveal>
      <div className="section-header">
        <span className="card-label" id="order-book-title"><BookOpen size={14} aria-hidden="true" /> Order book · {outcomeName}</span>
        {book && (
          <span className="book-stats">
            <span>Mid <strong>{cents(book.mid)}</strong></span>
            <span>Spread <strong>{cents(book.spread)}</strong></span>
            <span className="book-live"><i className="live-dot" aria-hidden="true" /> 5s</span>
          </span>
        )}
      </div>
      {error && !book ? (
        <p className="smart-empty">The order book is unavailable for this market.</p>
      ) : !book ? (
        <Skeleton width="100%" height={220} />
      ) : (
        <div className="book-grid">
          <Side levels={book.bids} kind="bid" maxTotal={maxTotal} changed={changed} />
          <Side levels={book.asks} kind="ask" maxTotal={maxTotal} changed={changed} />
        </div>
      )}
    </section>
  );
}
