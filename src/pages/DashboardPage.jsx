import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, CircleDollarSign, Coins, Droplets, Layers3, RefreshCw, TrendingDown, TrendingUp, Users, Waves } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import AnimatedNumber from "../components/AnimatedNumber";
import CategoryBreakdown from "../components/CategoryBreakdown";
import Avatar from "../components/Avatar";
import MarketImage from "../components/MarketImage";
import TradeFeed from "../components/TradeFeed";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import WatchlistSection from "../components/WatchlistSection";
import { StatsSkeleton, TableSkeleton } from "../components/Skeleton";
import { getTopAccounts } from "../services/ecosystemService";
import { getMarketPulse } from "../services/marketService";
import { shortenAddress } from "../utils/address";
import { formatCompactCurrency, formatNumber, formatPrice, formatPriceChange, formatTimeAgo } from "../utils/formatters";
import { getToneClass } from "../utils/states";

const REFRESH_MS = 60_000;

function MarketList({ markets, metric }) {
  if (!markets.length) return <EmptyState icon={Layers3} title="Nothing to show right now" />;
  return (
    <ul className="pulse-market-list stagger">
      {markets.map((m, i) => (
        <li key={m.conditionId} style={{ "--i": i }}>
          <Link to={`/market/${encodeURIComponent(m.slug || m.conditionId)}`} className="pulse-market-row">
            <MarketImage icon={m.icon} tag={m.question.slice(0, 3).toUpperCase()} size={28} radius={6} />
            <span className="pulse-market-title">{m.question}</span>
            <span className="pulse-market-price">{formatPrice(m.outcomes[0]?.price)}</span>
            {metric === "change" ? (
              <span className={`pulse-market-metric ${getToneClass(m.change1d)}`}>{formatPriceChange(m.change1d)}</span>
            ) : (
              <span className="pulse-market-metric">{formatCompactCurrency(m.volume24h)}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const [pulse, setPulse] = useState({ status: "loading", data: null });
  const [traders, setTraders] = useState(null);
  const [tick, setTick] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard | PolyScripts";
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getMarketPulse({ signal: controller.signal })
      .then((data) => setPulse({ status: "ready", data }))
      .catch((error) => {
        if (error?.name !== "AbortError") setPulse((p) => ({ status: p.data ? "ready" : "error", data: p.data }));
      });
    return () => controller.abort();
  }, [tick]);

  useEffect(() => {
    let active = true;
    getTopAccounts({ limit: 6, metric: "pnl", period: "WEEK" })
      .then((rows) => active && setTraders(rows))
      .catch(() => active && setTraders([]));
    return () => {
      active = false;
    };
  }, []);

  const data = pulse.data;
  const maxCategory = data?.categories?.[0]?.volume24h || 1;

  return (
    <main id="main-content" className="container main-content">
      <PageHeader eyebrow="Live · refreshes every minute" title="Dashboard" description="The pulse of Polymarket right now: money flow, momentum and whale activity.">
        {data && <span className="dashboard-updated"><RefreshCw size={12} aria-hidden="true" /> Updated {formatTimeAgo(data.updatedAt)}</span>}
      </PageHeader>

      {pulse.status === "error" ? (
        <ErrorState title="Unable to load live market data" description="Polymarket's APIs did not respond." onRetry={() => setTick((t) => t + 1)} />
      ) : !data ? (
        <StatsSkeleton />
      ) : (
        <div className="stats-grid stats-grid-five stagger">
          <StatCard icon={CircleDollarSign} label="24h volume" value={<AnimatedNumber value={data.volume24h} format={formatCompactCurrency} />} sub={`Top ${data.marketCount} markets`} />
          <StatCard icon={Droplets} label="Order book liquidity" value={<AnimatedNumber value={data.liquidity} format={formatCompactCurrency} />} sub="Same markets" />
          <StatCard icon={Waves} label="Whale trades · 1h" value={<AnimatedNumber value={data.whaleCount1h} format={(v) => formatNumber(Math.round(v))} />} sub={`${formatCompactCurrency(data.whaleNotional1h)} notional · $10K+`} />
          <StatCard
            icon={data.whaleBuyShare != null && data.whaleBuyShare >= 0.5 ? TrendingUp : TrendingDown}
            label="Whale buy share · 1h"
            value={<AnimatedNumber value={data.whaleBuyShare == null ? null : data.whaleBuyShare * 100} format={(v) => (v == null ? "N/A" : `${Math.round(v)}%`)} />}
            sub={data.whaleBuyShare == null ? "No whale trades" : data.whaleBuyShare >= 0.5 ? "Whales net buying" : "Whales net selling"}
            subTone={data.whaleBuyShare == null ? "neutral" : data.whaleBuyShare >= 0.5 ? "positive" : "negative"}
          />
          <StatCard icon={Coins} label="LP rewards / day" value={<AnimatedNumber value={data.rewardsDaily} format={formatCompactCurrency} />} sub="Across these markets" />
        </div>
      )}

      <div className="dashboard-columns" data-reveal>
        <section className="card" aria-labelledby="dash-volume">
          <div className="section-header"><span className="card-label" id="dash-volume">Most traded · 24h</span><Link to="/markets" className="dashboard-more">All markets <ArrowUpRight size={12} /></Link></div>
          {data ? <MarketList markets={data.topVolume} metric="volume" /> : <TableSkeleton rows={6} />}
        </section>
        <section className="card" aria-labelledby="dash-gainers">
          <div className="section-header"><span className="card-label" id="dash-gainers">Biggest gainers · 24h</span><Link to="/markets?sort=movers" className="dashboard-more">Movers <ArrowUpRight size={12} /></Link></div>
          {data ? <MarketList markets={data.gainers} metric="change" /> : <TableSkeleton rows={6} />}
        </section>
        <section className="card" aria-labelledby="dash-losers">
          <div className="section-header"><span className="card-label" id="dash-losers">Biggest drops · 24h</span></div>
          {data ? <MarketList markets={data.losers} metric="change" /> : <TableSkeleton rows={6} />}
        </section>
      </div>

      <div className="overview-grid dashboard-grid" data-reveal>
        <section className="section" aria-labelledby="dash-whales">
          <div className="section-header">
            <h2 className="section-title" id="dash-whales">Latest whale trades</h2>
            <Link to="/whales" className="dashboard-more">Live tracker <ArrowUpRight size={12} /></Link>
          </div>
          {data ? (data.recentWhales.length ? <TradeFeed trades={data.recentWhales} compact /> : <EmptyState icon={Waves} title="No whale trades yet" />) : <TableSkeleton rows={8} />}
        </section>

        <div className="overview-stack">
          <section className="card" aria-labelledby="dash-categories">
            <span className="card-label" id="dash-categories">24h volume by category</span>
            <p className="card-description">Top markets grouped by title keywords</p>
            <div className="dashboard-body">
              {data ? (
                <CategoryBreakdown
                  categories={data.categories.map((c) => ({
                    category: c.category,
                    count: `${formatCompactCurrency(c.volume24h)} · ${c.markets} mkts`,
                    share: c.volume24h / maxCategory,
                  }))}
                />
              ) : (
                <TableSkeleton rows={5} />
              )}
            </div>
          </section>

          <section className="card" aria-labelledby="dash-traders">
            <div className="section-header"><span className="card-label" id="dash-traders">Top traders this week</span><Link to="/leaderboard" className="dashboard-more">Leaderboard <ArrowUpRight size={12} /></Link></div>
            {traders === null ? (
              <TableSkeleton rows={6} />
            ) : traders.length === 0 ? (
              <EmptyState icon={Users} title="Leaderboard unavailable" />
            ) : (
              <ul className="top-accounts-list">
                {traders.map((account) => (
                  <li key={account.address}>
                    <button type="button" className="top-account-row" onClick={() => navigate(`/profile/${encodeURIComponent(account.username || account.address)}`)}>
                      <span className="top-account-rank">{account.rank ?? "-"}</span>
                      <Avatar account={account} size={30} />
                      <span className="top-account-identity">
                        <span className="top-account-name">{account.username || account.displayName || shortenAddress(account.address)}</span>
                        <span className="top-account-address">{shortenAddress(account.address)}</span>
                      </span>
                      <span className={`top-account-volume ${getToneClass(account.pnl)}`}>{formatCompactCurrency(account.pnl)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <WatchlistSection />
    </main>
  );
}
