import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ExternalLink, RefreshCw, Scale } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Filters from "../components/Filters";
import MarketImage from "../components/MarketImage";
import AnimatedNumber from "../components/AnimatedNumber";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { TableSkeleton } from "../components/Skeleton";
import { getArbOpportunities } from "../services/marketService";
import { formatCompactCurrency, formatEndsIn, formatTimeAgo } from "../utils/formatters";

const KINDS = ["All", "Buy basket", "Sell basket"];
const MIN_EDGES = [
  { label: "Any edge", value: 0 },
  { label: "0.5%+", value: 0.005 },
  { label: "1%+", value: 0.01 },
  { label: "3%+", value: 0.03 },
];
const REFRESH_MS = 30_000;

function cents(p) {
  return p == null ? "-" : `${(p * 100).toFixed(1)}¢`;
}

function ArbCard({ opp, index }) {
  const [open, setOpen] = useState(false);
  const buying = opp.kind === "buy";
  return (
    <article className="arb-card" style={{ "--i": Math.min(index, 12) }}>
      <div className="arb-card-main">
        <MarketImage icon={opp.icon} tag="ARB" size={40} radius={10} />
        <div className="arb-card-text">
          <strong>{opp.title}</strong>
          <span>
            {opp.outcomes} outcomes · {formatCompactCurrency(opp.volume24h)} 24h vol
            {opp.endDate ? ` · ${formatEndsIn(opp.endDate)}` : ""}
          </span>
        </div>
        <div className="arb-edge">
          <span className={`arb-kind is-${opp.kind}`}>{buying ? "Buy all YES" : "Sell all YES"}</span>
          <strong>+{(opp.edge * 100).toFixed(2)}%</strong>
          <small>{buying ? `Basket costs ${cents(opp.basket)} → pays $1` : `Basket sells for ${cents(opp.basket)} → owes $1`}</small>
        </div>
      </div>
      <div className="arb-card-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <ChevronDown size={14} className={open ? "is-flipped" : ""} /> {open ? "Hide" : "Show"} legs
        </button>
        <a className="btn btn-secondary" href={`https://polymarket.com/event/${encodeURIComponent(opp.slug)}`} target="_blank" rel="noreferrer noopener">
          <ExternalLink size={13} /> Open event
        </a>
      </div>
      {open && (
        <div className="arb-legs">
          {opp.legs.map((leg) => (
            <Link key={leg.slug || leg.name} to={`/market/${encodeURIComponent(leg.slug)}`} className="arb-leg">
              <span>{leg.name}</span>
              <span className="arb-leg-quote">bid {cents(leg.bid)}</span>
              <strong className={buying ? "tone-positive" : ""}>ask {cents(leg.ask)}</strong>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

export default function ArbitragePage() {
  const [state, setState] = useState({ status: "loading", list: [], scanned: 0, at: null });
  const [kind, setKind] = useState("All");
  const [minEdge, setMinEdge] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    document.title = "Arbitrage Scanner | PolyScripts";
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getArbOpportunities({ signal: controller.signal })
      .then(({ list, eventsScanned }) => setState({ status: "ready", list, scanned: eventsScanned, at: Date.now() }))
      .catch((error) => {
        if (error?.name !== "AbortError") setState((s) => ({ ...s, status: s.list.length ? "ready" : "error" }));
      });
    return () => controller.abort();
  }, [tick]);

  const visible = state.list.filter(
    (o) => o.edge >= minEdge && (kind === "All" || (kind === "Buy basket" ? o.kind === "buy" : o.kind === "sell")),
  );
  const best = state.list[0]?.edge ?? null;

  return (
    <main id="main-content" className="container main-content">
      <PageHeader eyebrow="Live · rescans every 30s" title="Arbitrage Scanner" description="Multi-outcome markets where the prices of all outcomes don't add up to $1.">
        {state.at && <span className="dashboard-updated"><RefreshCw size={12} aria-hidden="true" /> Scanned {formatTimeAgo(state.at)}</span>}
      </PageHeader>

      <section className="pulse-kpis" aria-label="Scan summary">
        <div className="pulse-kpi"><span>Opportunities</span><strong><AnimatedNumber value={state.list.length} format={(v) => Math.round(v)} /></strong></div>
        <div className="pulse-kpi"><span>Best gross edge</span><strong className="tone-positive"><AnimatedNumber value={best} format={(v) => (v == null ? "N/A" : `${(v * 100).toFixed(2)}%`)} /></strong></div>
        <div className="pulse-kpi"><span>Events scanned</span><strong><AnimatedNumber value={state.scanned} format={(v) => Math.round(v)} /></strong></div>
        <div className="pulse-kpi"><span>Buy / sell baskets</span><strong>{state.list.filter((o) => o.kind === "buy").length} / {state.list.filter((o) => o.kind === "sell").length}</strong></div>
      </section>

      <div className="tab-controls-row">
        <Filters options={KINDS} active={kind} onChange={setKind} ariaLabel="Basket type" />
        <Filters options={MIN_EDGES.map((m) => m.label)} active={MIN_EDGES.find((m) => m.value === minEdge)?.label} onChange={(label) => setMinEdge(MIN_EDGES.find((m) => m.label === label).value)} ariaLabel="Minimum edge" />
      </div>

      {state.status === "loading" ? (
        <TableSkeleton rows={6} />
      ) : state.status === "error" ? (
        <ErrorState title="Unable to scan markets" description="Polymarket's market API did not respond." onRetry={() => setTick((t) => t + 1)} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Scale} title="No mispricings right now" description="Markets are efficiently priced at the moment. The scanner rescans every 30 seconds." />
      ) : (
        <div className="arb-list stagger">
          {visible.map((opp, i) => <ArbCard key={opp.key} opp={opp} index={i} />)}
        </div>
      )}

      <aside className="signal-legend">
        <p><strong>How it works.</strong> In a multi-outcome event exactly one outcome resolves YES. If buying YES on every outcome at the best asks costs less than $1, the basket is guaranteed to pay $1. If selling YES on every outcome at the best bids brings in more than $1, you owe at most $1.</p>
        <p className="signal-legend-note">Scans every multi-outcome event among the ~300 most active markets. Edges use top-of-book quotes and exclude fees, slippage and order-book depth. Events that can resolve to an unlisted outcome are excluded from buy baskets. Information only, not financial advice.</p>
      </aside>
    </main>
  );
}
