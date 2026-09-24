import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Filters from "../components/Filters";
import SearchInput from "../components/SearchInput";
import MarketCard from "../components/MarketCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { Skeleton } from "../components/Skeleton";
import { MARKET_SORTS, getMarketsList, searchMarkets } from "../services/marketService";

const SORT_KEYS = Object.keys(MARKET_SORTS);

function MarketGridSkeleton() {
  return (
    <div className="market-grid">
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="market-card is-skeleton">
          <Skeleton width="80%" height={16} />
          <Skeleton width="100%" height={34} />
          <Skeleton width="60%" height={12} />
        </div>
      ))}
    </div>
  );
}

export default function MarketsPage() {
  const [params, setParams] = useSearchParams();
  const sort = SORT_KEYS.includes(params.get("sort")) ? params.get("sort") : "volume";
  const [query, setQuery] = useState(params.get("q") || "");
  const [debounced, setDebounced] = useState(query);
  const [state, setState] = useState({ status: "loading", markets: [] });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    document.title = "Markets | PolyScripts";
    // Live odds: refresh quietly every 30s so cards flash on price moves.
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setReload((r) => r + 1);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ status: s.markets.length ? "refreshing" : "loading", markets: s.markets }));
    const request = debounced.length >= 2
      ? searchMarkets(debounced, { signal: controller.signal })
      : getMarketsList({ sort, signal: controller.signal });
    request
      .then((markets) => setState({ status: "ready", markets }))
      .catch((error) => {
        if (error?.name !== "AbortError") setState({ status: "error", markets: [] });
      });
    return () => controller.abort();
  }, [sort, debounced, reload]);

  function setSort(key) {
    const next = new URLSearchParams(params);
    next.set("sort", key);
    setParams(next, { replace: true });
  }

  const searching = debounced.length >= 2;
  return (
    <main id="main-content" className="container main-content">
      <PageHeader eyebrow="Live · odds refresh every 30s" title="Markets" description="Every active Polymarket market with live odds, momentum, liquidity and rewards." />

      <div className="tab-controls-row">
        <Filters
          options={SORT_KEYS.map((k) => MARKET_SORTS[k].label)}
          active={searching ? null : MARKET_SORTS[sort].label}
          onChange={(label) => {
            setQuery("");
            setSort(SORT_KEYS.find((k) => MARKET_SORTS[k].label === label));
          }}
          ariaLabel="Sort markets"
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search markets" ariaLabel="Search markets" />
      </div>

      {state.status === "loading" && state.markets.length === 0 ? (
        <MarketGridSkeleton />
      ) : state.status === "error" ? (
        <ErrorState title="Unable to load markets" description="Please try again." onRetry={() => setReload((r) => r + 1)} />
      ) : state.markets.length === 0 ? (
        <EmptyState icon={SearchX} title="No markets found" description={searching ? "Try a different search." : "No active markets match this view."} />
      ) : (
        <div className={`market-grid stagger ${state.status === "loading" ? "is-refreshing" : ""}`}>
          {state.markets.map((market, i) => <MarketCard key={market.conditionId || market.id} market={market} index={i} />)}
        </div>
      )}
    </main>
  );
}
