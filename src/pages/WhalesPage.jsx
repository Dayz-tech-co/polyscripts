import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, Pause, Play, Waves } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Filters from "../components/Filters";
import TradeFeed from "../components/TradeFeed";
import AnimatedNumber from "../components/AnimatedNumber";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { TableSkeleton } from "../components/Skeleton";
import { SIGNALS, getWhaleTrades } from "../services/marketService";
import { formatCompactCurrency } from "../utils/formatters";
import { disableNotifications, notificationsEnabled, notify, requestNotifications } from "../utils/notifications";

const SIZES = [
  { label: "$1K+", value: 1_000 },
  { label: "$5K+", value: 5_000 },
  { label: "$10K+", value: 10_000 },
  { label: "$50K+", value: 50_000 },
  { label: "$100K+", value: 100_000 },
];
const SIDES = ["All", "Buys", "Sells"];
const VIEWS = ["All trades", "Signals only", "Insider signals"];
const POLL_MS = 15_000;

export default function WhalesPage() {
  const [minCash, setMinCash] = useState(10_000);
  const [side, setSide] = useState("All");
  const [view, setView] = useState("All trades");
  const [paused, setPaused] = useState(false);
  const [alerts, setAlerts] = useState(notificationsEnabled);
  const [state, setState] = useState({ status: "loading", trades: [] });
  const [freshIds, setFreshIds] = useState(() => new Set());
  const [tick, setTick] = useState(0);
  const known = useRef(null);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  useEffect(() => {
    document.title = "Whale Tracker | PolyScripts";
  }, []);

  // Reset "new trade" tracking whenever the query changes.
  useEffect(() => {
    known.current = null;
    setState({ status: "loading", trades: [] });
  }, [minCash, side]);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), POLL_MS);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const controller = new AbortController();
    const apiSide = side === "Buys" ? "BUY" : side === "Sells" ? "SELL" : undefined;
    getWhaleTrades({ minCash, side: apiSide, limit: 100, signal: controller.signal })
      .then((trades) => {
        const seen = known.current;
        const incoming = seen ? trades.filter((t) => !seen.has(t.id)) : [];
        known.current = new Set(trades.map((t) => t.id));
        setFreshIds(new Set(incoming.map((t) => t.id)));
        setState({ status: "ready", trades });
        if (alertsRef.current && incoming.length > 0) {
          const top = incoming.reduce((a, b) => ((b.notional ?? 0) > (a.notional ?? 0) ? b : a));
          notify(`${incoming.length} new whale trade${incoming.length > 1 ? "s" : ""}`, `${top.side === "SELL" ? "Sell" : "Buy"} ${formatCompactCurrency(top.notional)} · ${top.title}`);
        }
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setState((s) => ({ status: s.trades.length ? "ready" : "error", trades: s.trades }));
      });
    return () => controller.abort();
  }, [minCash, side, tick]);

  const visible = useMemo(() => {
    if (view === "Signals only") return state.trades.filter((t) => t.signals.length > 0);
    if (view === "Insider signals") return state.trades.filter((t) => t.signals.includes("insider"));
    return state.trades;
  }, [state.trades, view]);

  const summary = useMemo(() => {
    const list = state.trades;
    const buys = list.filter((t) => t.side === "BUY");
    return {
      total: list.reduce((s, t) => s + (t.notional || 0), 0),
      buyShare: list.length ? buys.length / list.length : null,
      signals: list.filter((t) => t.signals.length > 0).length,
      largest: list.reduce((m, t) => Math.max(m, t.notional || 0), 0),
    };
  }, [state.trades]);

  async function toggleAlerts() {
    if (alerts) {
      disableNotifications();
      setAlerts(false);
      return;
    }
    setAlerts(await requestNotifications());
  }

  return (
    <main id="main-content" className="container main-content whales-page">
      <PageHeader eyebrow="Live · refreshes every 15s" title="Whale Tracker" description="Every large Polymarket trade as it happens, with fresh-wallet and insider signals.">
        <button type="button" className="btn btn-secondary" onClick={toggleAlerts} aria-pressed={alerts}>
          {alerts ? <Bell size={14} /> : <BellOff size={14} />} {alerts ? "Alerts on" : "Browser alerts"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
          {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? "Resume" : "Pause"}
        </button>
      </PageHeader>

      <section className="pulse-kpis stagger" aria-label="Feed summary">
        <div className="pulse-kpi"><span>Notional in feed</span><strong><AnimatedNumber value={summary.total} format={formatCompactCurrency} /></strong></div>
        <div className="pulse-kpi"><span>Buy share</span><strong><AnimatedNumber value={summary.buyShare == null ? null : summary.buyShare * 100} format={(v) => (v == null ? "N/A" : `${Math.round(v)}%`)} /></strong></div>
        <div className="pulse-kpi"><span>Largest trade</span><strong><AnimatedNumber value={summary.largest} format={formatCompactCurrency} /></strong></div>
        <div className="pulse-kpi"><span>Flagged trades</span><strong><AnimatedNumber value={summary.signals} format={(v) => Math.round(v)} /></strong></div>
      </section>

      <div className="tab-controls-row">
        <Filters options={SIZES.map((s) => s.label)} active={SIZES.find((s) => s.value === minCash)?.label} onChange={(label) => setMinCash(SIZES.find((s) => s.label === label).value)} ariaLabel="Minimum trade size" />
        <div className="tab-controls-right">
          <Filters options={SIDES} active={side} onChange={setSide} ariaLabel="Trade side" />
          <Filters options={VIEWS} active={view} onChange={setView} ariaLabel="Signal filter" />
        </div>
      </div>

      {state.status === "loading" ? (
        <TableSkeleton rows={10} />
      ) : state.status === "error" ? (
        <ErrorState title="Unable to load the trade feed" description="Polymarket's trade API did not respond." onRetry={() => setTick((t) => t + 1)} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Waves} title="No trades match these filters" description="Lower the size threshold or show all trades." />
      ) : (
        <TradeFeed trades={visible} freshIds={freshIds} />
      )}

      <aside className="signal-legend" aria-label="Signal definitions">
        {Object.entries(SIGNALS).map(([key, s]) => (
          <p key={key}><span className={`ps-badge is-${s.tone}`}>{s.label}</span> {s.hint}</p>
        ))}
        <p className="signal-legend-note">Signals are automatic pattern flags on public data, not accusations. Wallet history is looked up for the 30 most recent wallets in the feed.</p>
      </aside>
    </main>
  );
}
