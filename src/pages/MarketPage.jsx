import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Brain, ExternalLink, SearchX, Waves } from "lucide-react";
import Avatar from "../components/Avatar";
import Filters from "../components/Filters";
import MarketImage from "../components/MarketImage";
import MarketPriceChart from "../components/MarketPriceChart";
import TradeFeed from "../components/TradeFeed";
import OrderBook from "../components/OrderBook";
import AnimatedNumber from "../components/AnimatedNumber";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { ChartSkeleton, Skeleton, TableSkeleton } from "../components/Skeleton";
import { PRICE_RANGES, getMarketDetail, getMarketHolders, getMarketPriceHistory, getMarketTrades } from "../services/marketService";
import { shortenAddress } from "../utils/address";
import {
  formatCompactCurrency,
  formatDate,
  formatEndsIn,
  formatNumber,
  formatPrice,
  formatPriceChange,
  formatSignedCurrency,
} from "../utils/formatters";
import { getToneClass } from "../utils/states";

const RANGES = Object.keys(PRICE_RANGES);
const TRADE_SIZES = [
  { label: "$100+", value: 100 },
  { label: "$1K+", value: 1_000 },
  { label: "$10K+", value: 10_000 },
];

/** Runs `factory` whenever `key` changes; factory returns a promise or null. */
function useAsync(factory, key) {
  const [state, setState] = useState({ status: "loading", data: null });
  const factoryRef = useRef(factory);
  factoryRef.current = factory;
  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ status: "loading", data: s.data }));
    const promise = factoryRef.current(controller.signal);
    if (!promise) {
      setState({ status: "idle", data: null });
      return () => controller.abort();
    }
    promise
      .then((data) => setState({ status: "ready", data }))
      .catch((error) => {
        if (error?.name !== "AbortError") setState({ status: "error", data: null });
      });
    return () => controller.abort();
  }, [key]);
  return state;
}

function SmartMoney({ sides }) {
  const lean = useMemo(() => {
    const ranked = [...sides].sort((a, b) => b.smartValue - a.smartValue);
    const total = sides.reduce((s, x) => s + x.smartValue, 0);
    if (!total) return null;
    return { outcome: ranked[0].outcome.name, share: ranked[0].smartValue / total };
  }, [sides]);

  return (
    <section className="card smart-money" aria-labelledby="smart-money-title" data-reveal>
      <div className="smart-card-head">
        <span className="card-label" id="smart-money-title"><Brain size={14} aria-hidden="true" /> Smart money</span>
        {lean && (
          <span className="smart-money-lean">
            Profitable traders lean <strong>{lean.outcome}</strong> · {Math.round(lean.share * 100)}% of their value
          </span>
        )}
      </div>
      <div className="smart-money-grid">
        {sides.map((side) => (
          <div key={side.outcome.index} className="smart-money-side">
            <div className="smart-money-side-head">
              <strong>{side.outcome.name}</strong>
              <span>{side.smartCount}/{side.holders.length} top holders profitable</span>
            </div>
            <div className="smart-money-bar grow-bar" aria-hidden="true">
              <i style={{ width: `${side.totalValue ? (side.smartValue / side.totalValue) * 100 : 0}%` }} />
            </div>
            <ol className="holder-list">
              {side.holders.map((h) => (
                <li key={h.address}>
                  <Link to={`/profile/${encodeURIComponent(h.address)}`} className="holder-row">
                    <Avatar account={h.account} size={24} />
                    <span className="holder-name">{h.account.username || h.account.displayName || shortenAddress(h.address)}</span>
                    <span className="holder-value">{formatCompactCurrency(h.value)}</span>
                    <span className={`holder-pnl ${getToneClass(h.allTime?.pnl)}`} title="All-time PnL">
                      {h.allTime ? formatSignedCurrency(h.allTime.pnl, { decimals: 0 }) : "N/A"}
                    </span>
                  </Link>
                </li>
              ))}
              {side.holders.length === 0 && <li className="smart-empty">No holders reported.</li>}
            </ol>
          </div>
        ))}
      </div>
      <p className="smart-card-note">Top holders per outcome from Polymarket&apos;s holders API. &quot;Profitable&quot; means positive all-time PnL on the public leaderboard. Value = shares × current price.</p>
    </section>
  );
}

export default function MarketPage() {
  const { slug } = useParams();
  const [range, setRange] = useState("1W");
  const [outcomeIndex, setOutcomeIndex] = useState(0);
  const [minTrade, setMinTrade] = useState(100);
  const [showRules, setShowRules] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setOutcomeIndex(0);
    setShowRules(false);
  }, [slug]);

  const marketState = useAsync((signal) => getMarketDetail(slug, { signal }), `${slug}|${reload}`);
  const market = marketState.data;
  const outcome = market?.outcomes[outcomeIndex] || market?.outcomes[0];

  const history = useAsync(
    (signal) => (outcome?.tokenId ? getMarketPriceHistory(outcome.tokenId, range, { signal }) : null),
    `${outcome?.tokenId}|${range}`,
  );
  const holders = useAsync((signal) => (market ? getMarketHolders(market, { signal }) : null), market?.conditionId);
  const trades = useAsync(
    (signal) => (market ? getMarketTrades(market.conditionId, { minCash: minTrade, signal }) : null),
    `${market?.conditionId}|${minTrade}`,
  );

  useEffect(() => {
    document.title = market ? `${market.question} | PolyScripts` : "Market | PolyScripts";
  }, [market]);

  if (marketState.status === "error") {
    return (
      <main id="main-content" className="container main-content">
        <ErrorState title="Unable to load this market" description="Please try again." onRetry={() => setReload((r) => r + 1)} />
      </main>
    );
  }
  if (marketState.status === "ready" && !market) {
    return (
      <main id="main-content" className="container main-content">
        <EmptyState icon={SearchX} title="Market not found" description="It may have been removed or the link is wrong." action={<Link className="btn btn-secondary" to="/markets">Browse markets</Link>} />
      </main>
    );
  }

  const polymarketUrl = market ? `https://polymarket.com/event/${encodeURIComponent(market.eventSlug || market.slug)}` : null;
  const kpis = market
    ? [
        { label: "24h volume", value: <AnimatedNumber value={market.volume24h} format={formatCompactCurrency} /> },
        { label: "Total volume", value: <AnimatedNumber value={market.volume} format={formatCompactCurrency} /> },
        { label: "Liquidity", value: <AnimatedNumber value={market.liquidity} format={formatCompactCurrency} /> },
        { label: "24h move", value: formatPriceChange(market.change1d), tone: getToneClass(market.change1d) },
        { label: "Spread", value: market.spread != null ? formatPriceChange(market.spread).replace("+", "") : "N/A" },
        { label: "Ends", value: market.endDate ? formatDate(market.endDate) : "N/A", note: formatEndsIn(market.endDate) },
      ]
    : [];

  return (
    <main id="main-content" className="container main-content market-page">
      <Link to="/markets" className="reward-card-back"><ArrowLeft size={14} /> All markets</Link>

      {!market ? (
        <div className="market-hero"><Skeleton width="70%" height={26} /><Skeleton width="40%" height={14} /></div>
      ) : (
        <header className="market-hero">
          <MarketImage icon={market.icon} tag={market.question.slice(0, 3).toUpperCase()} size={56} radius={12} />
          <div className="market-hero-text">
            {market.eventTitle && market.eventTitle !== market.question && <span className="page-eyebrow">{market.eventTitle}</span>}
            <h1 className="page-title">{market.question}</h1>
            <div className="market-hero-outcomes">
              {market.outcomes.map((o) => (
                <button key={o.index} type="button" className={`market-outcome-pill ${o.index === outcome?.index ? "is-active" : ""} is-${o.index === 0 ? "a" : "b"}`} onClick={() => setOutcomeIndex(o.index)}>
                  <span>{o.name}</span>
                  <strong>{formatPrice(o.price)}</strong>
                </button>
              ))}
            </div>
          </div>
          <a className="btn btn-secondary market-hero-link" href={polymarketUrl} target="_blank" rel="noreferrer noopener">
            <ExternalLink size={14} aria-hidden="true" /> Trade on Polymarket
          </a>
        </header>
      )}

      {market && (
        <section className="pulse-kpis market-kpis stagger" aria-label="Market statistics">
          {kpis.map((k) => (
            <div key={k.label} className="pulse-kpi">
              <span>{k.label}</span>
              <strong className={k.tone}>{k.value}</strong>
              {k.note && <small>{k.note}</small>}
            </div>
          ))}
        </section>
      )}

      <section className="card market-chart-card" aria-label="Price history" data-reveal>
        <div className="section-header">
          <span className="card-label">{outcome ? `${outcome.name} probability` : "Probability"}</span>
          <Filters options={RANGES} active={range} onChange={setRange} ariaLabel="Chart range" />
        </div>
        {history.status === "loading" && !history.data ? <ChartSkeleton /> : <MarketPriceChart points={history.data || []} label={outcome?.name} />}
      </section>

      {outcome?.tokenId && <OrderBook key={outcome.tokenId} tokenId={outcome.tokenId} outcomeName={outcome.name} />}

      {holders.status === "loading" ? (
        <TableSkeleton rows={6} />
      ) : holders.data?.length ? (
        <SmartMoney sides={holders.data} />
      ) : null}

      <section className="section" aria-labelledby="market-trades-title" data-reveal>
        <div className="section-header">
          <h2 className="section-title" id="market-trades-title">Recent trades</h2>
          <Filters options={TRADE_SIZES.map((s) => s.label)} active={TRADE_SIZES.find((s) => s.value === minTrade)?.label} onChange={(label) => setMinTrade(TRADE_SIZES.find((s) => s.label === label).value)} ariaLabel="Minimum trade size" />
        </div>
        {trades.status === "loading" && !trades.data ? (
          <TableSkeleton rows={6} />
        ) : trades.data?.length ? (
          <TradeFeed trades={trades.data} showMarket={false} />
        ) : (
          <EmptyState icon={Waves} title="No recent trades at this size" />
        )}
      </section>

      {market && (market.rewardsDaily || market.description) && (
        <section className="card market-details" aria-label="Market details">
          {market.rewardsDaily && (
            <div className="market-rewards">
              <span className="card-label">Liquidity rewards</span>
              <p>
                <strong>{formatCompactCurrency(market.rewardsDaily)}/day</strong> for makers quoting at least {formatNumber(market.rewardsMinSize)} shares within {market.rewardsMaxSpread ?? "N/A"}¢ of the midpoint.
              </p>
            </div>
          )}
          {market.description && (
            <div className="market-rules">
              <button type="button" className="btn btn-ghost" onClick={() => setShowRules((v) => !v)} aria-expanded={showRules}>
                {showRules ? "Hide" : "Show"} resolution rules
              </button>
              {showRules && <p className="market-rules-text">{market.description}</p>}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
