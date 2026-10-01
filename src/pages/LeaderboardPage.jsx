import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Crown, Medal, Search, SearchX, Trophy } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import SegmentControl from "../components/SegmentControl";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import PageLoader from "../components/PageLoader";
import { getLeaderboard } from "../services/ecosystemService";
import { shortenAddress } from "../utils/address";
import { formatCompactCurrency, formatSignedCurrency } from "../utils/formatters";
import { getToneClass } from "../utils/states";

const METRICS = [
  { label: "PnL", value: "pnl" },
  { label: "Volume", value: "volume" },
];

const CATEGORIES = [
  { label: "All", value: "OVERALL" },
  { label: "Politics", value: "POLITICS" },
  { label: "Sports", value: "SPORTS" },
  { label: "Crypto", value: "CRYPTO" },
  { label: "Economics", value: "ECONOMICS" },
  { label: "Finance", value: "FINANCE" },
  { label: "Tech", value: "TECH" },
  { label: "Culture", value: "CULTURE" },
  { label: "Weather", value: "WEATHER" },
  { label: "Mentions", value: "MENTIONS" },
];

const PERIODS = [
  { label: "1D", value: "DAY" },
  { label: "1W", value: "WEEK" },
  { label: "1M", value: "MONTH" },
  { label: "All", value: "ALL" },
];

function RankMark({ rank }) {
  if (rank === 1) {
    return (
      <span className="lb-rank is-gold" aria-label="Rank 1">
        <Crown size={13} aria-hidden="true" />
        1
      </span>
    );
  }
  if (rank === 2 || rank === 3) {
    return (
      <span className={`lb-rank is-${rank === 2 ? "silver" : "bronze"}`} aria-label={`Rank ${rank}`}>
        <Medal size={13} aria-hidden="true" />
        {rank}
      </span>
    );
  }
  return <span className="lb-rank" aria-label={`Rank ${rank}`}>{rank}</span>;
}

function PodiumCard({ row, place, onOpen }) {
  if (!row) return <div className={`lb-podium-card is-${place} is-empty`} />;
  const name = row.username || row.displayName || shortenAddress(row.address);
  return (
    <button type="button" className={`lb-podium-card is-${place}`} onClick={() => onOpen(row)}>
      <div className="lb-podium-place">
        {place === 1 ? <Crown size={14} /> : <Medal size={14} />}
        <span>#{place}</span>
      </div>
      <Avatar account={row} size={place === 1 ? 56 : 44} />
      <strong className="lb-podium-name">{name}</strong>
      <span className="lb-podium-address">{shortenAddress(row.address)}</span>
      <span className={`lb-podium-pnl ${getToneClass(row.pnl)}`}>
        {formatSignedCurrency(row.pnl, { decimals: 0 })}
      </span>
      <span className="lb-podium-vol">{formatCompactCurrency(row.volume)} vol</span>
    </button>
  );
}

export default function LeaderboardPage() {
  const [metric, setMetric] = useState("pnl");
  const [period, setPeriod] = useState("ALL");
  const [category, setCategory] = useState("OVERALL");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Leaderboard | PolyScripts";
  }, []);

  useEffect(() => {
    let active = true;
    setRows(null);
    setError(false);
    getLeaderboard({ metric, period, category, limit: 50 })
      .then((list) => {
        if (!active) return;
        setRows(list || []);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [metric, period, category, reloadToken]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !rows) return rows;
    return rows.filter((row) => {
      const name = (row.username || row.displayName || "").toLowerCase();
      const address = (row.address || "").toLowerCase();
      return name.includes(q) || address.includes(q);
    });
  }, [rows, query]);

  const podium = useMemo(() => {
    if (!visible?.length) return [null, null, null];
    const top = visible.slice(0, 3);
    return [top[1] || null, top[0] || null, top[2] || null]; // 2nd, 1st, 3rd visual order
  }, [visible]);

  function open(account) {
    navigate(`/profile/${encodeURIComponent(account.username || account.address)}`);
  }

  const rest = visible?.slice(3) || [];

  return (
    <main id="main-content" className="container main-content leaderboard-page-v2">
      <PageHeader
        eyebrow="Live Polymarket ranks"
        title="Leaderboard"
        description="Top traders by PnL or volume — filter by category and time."
      />

      <div className="lb-controls">
        <SegmentControl
          options={METRICS}
          value={metric}
          onChange={setMetric}
          ariaLabel="Leaderboard metric"
          variant="underline"
        />
        <SegmentControl
          options={PERIODS}
          value={period}
          onChange={setPeriod}
          ariaLabel="Leaderboard period"
          variant="underline"
          size="sm"
        />
        <label className="lb-search">
          <Search size={14} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search trader or wallet"
            aria-label="Search leaderboard"
          />
        </label>
      </div>

      <div className="lb-categories" role="tablist" aria-label="Categories">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            role="tab"
            aria-selected={category === c.value}
            className={`lb-cat ${category === c.value ? "is-active" : ""}`}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState title="Unable to load the leaderboard" description="Please try again." onRetry={() => setReloadToken((t) => t + 1)} />
      ) : rows === null ? (
        <PageLoader label="Loading leaderboard" detail="Ranking live Polymarket traders" />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchX} title="No leaderboard results" description="Try a different metric, period or search." />
      ) : (
        <>
          {!query && (
            <section className="lb-podium" aria-label="Top three">
              <PodiumCard row={podium[0]} place={2} onOpen={open} />
              <PodiumCard row={podium[1]} place={1} onOpen={open} />
              <PodiumCard row={podium[2]} place={3} onOpen={open} />
            </section>
          )}

          <section className="lb-board card" aria-label="Ranked traders">
            <div className="lb-board-head">
              <Trophy size={14} aria-hidden="true" />
              <span>{query ? "Search results" : "Full ranking"}</span>
              <em>{visible.length}</em>
            </div>
            <div className="lb-board-list">
              {(query ? visible : rest).map((row) => {
                const name = row.username || row.displayName || shortenAddress(row.address);
                return (
                  <button
                    type="button"
                    key={row.address}
                    className={`lb-row ${row.rank <= 3 ? "is-top" : ""}`}
                    onClick={() => open(row)}
                  >
                    <RankMark rank={row.rank} />
                    <Avatar account={row} size={34} />
                    <span className="lb-row-id">
                      <strong>{name}</strong>
                      <span>{shortenAddress(row.address)}</span>
                    </span>
                    <span className={`lb-row-pnl ${getToneClass(row.pnl)}`}>
                      {formatSignedCurrency(row.pnl, { decimals: 0 })}
                    </span>
                    <span className="lb-row-vol">{formatCompactCurrency(row.volume)}</span>
                    <ArrowUpRight size={14} className="lb-row-go" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
