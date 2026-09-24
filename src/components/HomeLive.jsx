import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Flame, Waves } from "lucide-react";
import MarketCard from "./MarketCard";
import TradeFeed from "./TradeFeed";
import { TableSkeleton } from "./Skeleton";
import { getMarketsList, getWhaleTrades } from "../services/marketService";

const POLL_MS = 20_000;

/** Homepage live strip: latest whale trades + hottest markets. */
export default function HomeLive() {
  const [whales, setWhales] = useState(null);
  const [markets, setMarkets] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getWhaleTrades({ minCash: 10_000, limit: 6, enrich: false, signal: controller.signal })
      .then(setWhales)
      .catch((error) => error?.name !== "AbortError" && setWhales((w) => w || []));
    return () => controller.abort();
  }, [tick]);

  useEffect(() => {
    const controller = new AbortController();
    getMarketsList({ sort: "volume", limit: 6, signal: controller.signal })
      .then(setMarkets)
      .catch((error) => error?.name !== "AbortError" && setMarkets([]));
    return () => controller.abort();
  }, []);

  return (
    <div className="home-live" data-reveal>
      <section className="section" aria-labelledby="home-whales">
        <div className="section-header">
          <h2 className="section-title section-title-live" id="home-whales"><Waves size={16} aria-hidden="true" /> Live whale trades <i className="live-dot" aria-hidden="true" /></h2>
          <Link to="/whales" className="dashboard-more">Open tracker <ArrowUpRight size={12} /></Link>
        </div>
        {whales === null ? <TableSkeleton rows={6} /> : whales.length ? <TradeFeed trades={whales} compact /> : <p className="smart-empty">No whale trades right now.</p>}
      </section>

      <section className="section" aria-labelledby="home-markets">
        <div className="section-header">
          <h2 className="section-title section-title-live" id="home-markets"><Flame size={16} aria-hidden="true" /> Hottest markets</h2>
          <Link to="/markets" className="dashboard-more">All markets <ArrowUpRight size={12} /></Link>
        </div>
        {markets === null ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="market-grid is-compact stagger">
            {markets.map((m, i) => <MarketCard key={m.conditionId} market={m} index={i} />)}
          </div>
        )}
      </section>
    </div>
  );
}
