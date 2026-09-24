import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellOff, Bookmark, Waves } from "lucide-react";
import PageHeader from "../components/PageHeader";
import TradeFeed from "../components/TradeFeed";
import WatchlistSection from "../components/WatchlistSection";
import EmptyState from "../components/EmptyState";
import { TableSkeleton } from "../components/Skeleton";
import { getWalletsTrades } from "../services/marketService";
import { getWatchlist, subscribeToWatchlist } from "../utils/watchlist";
import { disableNotifications, notificationsEnabled, notify, requestNotifications } from "../utils/notifications";
import { formatCompactCurrency } from "../utils/formatters";

const POLL_MS = 30_000;
const MAX_WALLETS = 25;

export default function WatchlistPage() {
  const [accounts, setAccounts] = useState(getWatchlist);
  const [state, setState] = useState({ status: "loading", trades: [] });
  const [freshIds, setFreshIds] = useState(() => new Set());
  const [alerts, setAlerts] = useState(notificationsEnabled);
  const [tick, setTick] = useState(0);
  const known = useRef(null);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  useEffect(() => {
    document.title = "Watchlist feed | PolyScripts";
    return subscribeToWatchlist(setAccounts);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), POLL_MS);
    return () => clearInterval(id);
  }, []);

  const addresses = accounts.slice(0, MAX_WALLETS).map((a) => a.address).join(",");

  useEffect(() => {
    known.current = null;
  }, [addresses]);

  useEffect(() => {
    if (!addresses) {
      setState({ status: "ready", trades: [] });
      return undefined;
    }
    const controller = new AbortController();
    getWalletsTrades(addresses.split(","), { signal: controller.signal })
      .then((trades) => {
        const list = trades.slice(0, 150);
        const seen = known.current;
        const incoming = seen ? list.filter((t) => !seen.has(t.id)) : [];
        known.current = new Set(list.map((t) => t.id));
        setFreshIds(new Set(incoming.map((t) => t.id)));
        setState({ status: "ready", trades: list });
        if (alertsRef.current) {
          for (const t of incoming.slice(0, 3)) {
            const who = t.account.username || t.account.displayName || "A watched wallet";
            notify(`${who} ${t.side === "SELL" ? "sold" : "bought"} ${formatCompactCurrency(t.notional)}`, `${t.outcome || ""} · ${t.title}`);
          }
        }
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setState((s) => ({ status: "ready", trades: s.trades }));
      });
    return () => controller.abort();
  }, [addresses, tick]);

  async function toggleAlerts() {
    if (alerts) {
      disableNotifications();
      setAlerts(false);
    } else {
      setAlerts(await requestNotifications());
    }
  }

  return (
    <main id="main-content" className="container main-content">
      <PageHeader eyebrow="Live · refreshes every 30s" title="Watchlist feed" description="Every trade from the wallets you follow, in one timeline.">
        <button type="button" className="btn btn-secondary" onClick={toggleAlerts} aria-pressed={alerts}>
          {alerts ? <Bell size={14} /> : <BellOff size={14} />} {alerts ? "Alerts on" : "Alert me on new trades"}
        </button>
      </PageHeader>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="You aren't following anyone yet"
          description="Open any trader's profile and tap the bookmark to follow them. Find traders on the Whale Tracker or Leaderboard."
          action={<div className="empty-actions"><Link className="btn btn-primary" to="/whales">Whale Tracker</Link><Link className="btn btn-secondary" to="/leaderboard">Leaderboard</Link></div>}
        />
      ) : (
        <div className="watch-layout">
          <section className="section" aria-labelledby="watch-feed-title">
            <h2 className="section-title" id="watch-feed-title">Latest trades</h2>
            {state.status === "loading" ? (
              <TableSkeleton rows={8} />
            ) : state.trades.length === 0 ? (
              <EmptyState icon={Waves} title="No recent trades" description="Your followed wallets haven't traded recently." />
            ) : (
              <TradeFeed trades={state.trades} freshIds={freshIds} />
            )}
          </section>
          <WatchlistSection />
        </div>
      )}
      <p className="smart-card-note">Your watchlist is stored in this browser. Alerts fire while a PolyScripts tab is open.</p>
    </main>
  );
}
