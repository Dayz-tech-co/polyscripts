import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronRight, SearchX } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Avatar from "../components/Avatar";
import Filters from "../components/Filters";
import SearchInput from "../components/SearchInput";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { TableSkeleton } from "../components/Skeleton";
import { getLeaderboard } from "../services/ecosystemService";
import { shortenAddress } from "../utils/address";
import { formatCompactCurrency, formatNumber, formatPercentage, formatSignedCurrency } from "../utils/formatters";
import { getToneClass } from "../utils/states";

const METRICS = [
  { label: "PnL", value: "pnl" },
  { label: "Volume", value: "volume" },
  { label: "Win Rate", value: "winRate" },
];

const PERIODS = [
  { label: "Daily", value: "DAY" },
  { label: "Weekly", value: "WEEK" },
  { label: "Monthly", value: "MONTH" },
  { label: "All Time", value: "ALL" },
];

export default function LeaderboardPage() {
  const [metric, setMetric] = useState("pnl");
  const [period, setPeriod] = useState("ALL");
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
    getLeaderboard({ metric, period, limit: 25 })
      .then((list) => active && setRows(list))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [metric, period, reloadToken]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !rows) return rows;
    return rows.filter((row) => {
      const name = (row.username || row.displayName || "").toLowerCase();
      const address = (row.address || "").toLowerCase();
      return name.includes(q) || address.includes(q);
    });
  }, [rows, query]);

  function open(account) {
    navigate(`/profile/${encodeURIComponent(account.username || account.address)}`);
  }

  const metricLabel = METRICS.find((m) => m.value === metric)?.label || "PnL";

  return (
    <main id="main-content" className="container main-content">
      <PageHeader title="Leaderboard" description="Explore top public accounts by performance." />

      <div className="tab-controls-row leaderboard-controls">
        <Filters options={METRICS.map((m) => m.label)} active={metricLabel} onChange={(label) => setMetric(METRICS.find((m) => m.label === label)?.value || "pnl")} ariaLabel="Leaderboard metric" />
        <div className="tab-controls-right">
          <SearchInput value={query} onChange={setQuery} placeholder="Search accounts" ariaLabel="Search leaderboard accounts" />
          <Filters options={PERIODS.map((p) => p.label)} active={PERIODS.find((p) => p.value === period)?.label} onChange={(label) => setPeriod(PERIODS.find((p) => p.label === label)?.value || "ALL")} ariaLabel="Leaderboard time range" />
        </div>
      </div>

      {error ? (
        <ErrorState title="Unable to load the leaderboard" description="Please try again." onRetry={() => setReloadToken((t) => t + 1)} />
      ) : rows === null ? (
        <TableSkeleton rows={10} />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchX} title="No leaderboard results" description="Try a different metric, period or search." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="positions-table leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Account</th>
                  <th>PnL</th>
                  <th>Volume</th>
                  <th>Win Rate</th>
                  <th>Markets</th>
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const pnlTone = getToneClass(row.pnl);
                  return (
                    <tr key={row.address} className={`leaderboard-row ${row.rank <= 3 ? "is-top" : ""}`}>
                      <td>
                        <span className={`leaderboard-rank ${row.rank <= 3 ? `rank-${row.rank}` : ""}`}>{row.rank}</span>
                      </td>
                      <td className="account-cell">
                        <button type="button" className="account-cell-btn" onClick={() => open(row)}>
                          <Avatar account={row} size={30} radius={9} />
                          <span className="account-cell-text">
                            <span className="account-cell-name">{row.username || row.displayName || shortenAddress(row.address)}</span>
                            <span className="account-cell-address">{shortenAddress(row.address)}</span>
                          </span>
                        </button>
                      </td>
                      <td className={`num-cell ${pnlTone}`}>{formatSignedCurrency(row.pnl, { decimals: 0 })}</td>
                      <td className="num-cell">{formatCompactCurrency(row.volume)}</td>
                      <td className="num-cell">{formatPercentage(row.winRate)}</td>
                      <td className="num-cell">{formatNumber(row.markets)}</td>
                      <td className="action-cell">
                        <button type="button" className="icon-btn icon-btn-sm" aria-label={`Open ${row.username || shortenAddress(row.address)}`} onClick={() => open(row)}>
                          <ArrowUpRight size={14} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="leaderboard-mobile-list">
            {visible.map((row) => {
              const pnlTone = getToneClass(row.pnl);
              return (
                <button type="button" key={row.address} className="leaderboard-card-mobile" onClick={() => open(row)}>
                  <div className="leaderboard-card-mobile-top">
                    <span className={`leaderboard-rank ${row.rank <= 3 ? `rank-${row.rank}` : ""}`}>{row.rank}</span>
                    <Avatar account={row} size={32} radius={9} />
                    <span className="account-cell-text">
                      <span className="account-cell-name">{row.username || row.displayName || shortenAddress(row.address)}</span>
                      <span className="account-cell-address">{shortenAddress(row.address)}</span>
                    </span>
                    <ChevronRight size={15} className="top-account-arrow" aria-hidden="true" />
                  </div>
                  <div className="leaderboard-card-mobile-grid">
                    <div className="position-card-stat">
                      <span className="position-card-stat-label">PnL</span>
                      <span className={`position-card-stat-value ${pnlTone}`}>{formatSignedCurrency(row.pnl, { decimals: 0 })}</span>
                    </div>
                    <div className="position-card-stat">
                      <span className="position-card-stat-label">Volume</span>
                      <span className="position-card-stat-value">{formatCompactCurrency(row.volume)}</span>
                    </div>
                    <div className="position-card-stat">
                      <span className="position-card-stat-label">Win Rate</span>
                      <span className="position-card-stat-value">{formatPercentage(row.winRate)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}