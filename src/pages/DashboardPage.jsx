import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowUpRight, Boxes, CircleDollarSign, Layers3, Radar, Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import PerformanceChart from "../components/PerformanceChart";
import DistributionChart from "../components/DistributionChart";
import CategoryBreakdown from "../components/CategoryBreakdown";
import Avatar from "../components/Avatar";
import { ActivityTypeBadge } from "../components/ActivityRow";
import EmptyState from "../components/EmptyState";
import WatchlistSection from "../components/WatchlistSection";
import { ChartSkeleton, StatsSkeleton, TableSkeleton } from "../components/Skeleton";
import {
  getActivityTrend,
  getCategoryBreakdown,
  getDashboardStats,
  getPerformanceDistribution,
  getRecentActivityFeed,
  getTopAccounts,
} from "../services/ecosystemService";
import { shortenAddress } from "../utils/address";
import { formatCompactCurrency, formatNumber, formatPrice, formatTimeAgo } from "../utils/formatters";

const UNAVAILABLE_NOTE =
  "The public Polymarket APIs do not expose ecosystem-wide totals, so an accurate figure cannot be shown here.";

function UnavailablePanel({ icon: Icon = Radar, title = "Unavailable", description = UNAVAILABLE_NOTE }) {
  return (
    <div className="card">
      <div className="empty-state">
        <Icon size={20} strokeWidth={1.5} className="empty-state-icon" aria-hidden="true" />
        <p className="empty-state-title">{title}</p>
        <p className="empty-state-description">{description}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [categories, setCategories] = useState(null);
  const [movers, setMovers] = useState(null);
  const [feed, setFeed] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard | PolyScripts";
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      getDashboardStats(),
      getActivityTrend(),
      getPerformanceDistribution(),
      getCategoryBreakdown(),
      getTopAccounts({ limit: 6, metric: "volume", period: "WEEK" }),
      getRecentActivityFeed({ limit: 8 }),
    ]).then(([s, t, d, c, m, f]) => {
      if (!active) return;
      setStats(s);
      setTrend(t);
      setDistribution(d);
      setCategories(c);
      setMovers(m);
      setFeed(f);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  function open(account) {
    navigate(`/profile/${encodeURIComponent(account.username || account.address)}`);
  }

  return (
    <main id="main-content" className="container main-content">
      <PageHeader title="Dashboard" description="Aggregate view of the Polymarket ecosystem." />

      <WatchlistSection />

      {!loaded ? (
        <StatsSkeleton />
      ) : stats ? (
        <div className="stats-grid stats-grid-five">
          <StatCard icon={Users} label="Tracked Accounts" value={formatNumber(stats.trackedAccounts)} />
          <StatCard icon={CircleDollarSign} label="Aggregate Volume" value={formatCompactCurrency(stats.aggregateVolume)} />
          <StatCard icon={Radar} label="Active Accounts" value={formatNumber(stats.activeAccounts)} />
          <StatCard icon={Layers3} label="Open Positions" value={formatNumber(stats.openPositions)} />
          <StatCard icon={Boxes} label="Markets Observed" value={formatNumber(stats.marketsObserved)} />
        </div>
      ) : (
        <UnavailablePanel icon={Users} title="Aggregate stats unavailable" />
      )}

      <div className="overview-grid dashboard-grid">
        <div className="card performance-card">
          <div className="performance-header">
            <div>
              <span className="card-label">Activity Trend</span>
              <div className="performance-change">
                <span>Cumulative volume over the last 30 days</span>
              </div>
            </div>
          </div>
          {!loaded ? <ChartSkeleton /> : trend ? <PerformanceChart data={trend} volumeMode /> : <UnavailablePanel icon={Activity} title="Activity trend unavailable" />}
        </div>

        <div className="card">
          <span className="card-label">Performance Distribution</span>
          <p className="card-description">Accounts by win rate band</p>
          <div className="dashboard-body">
            {!loaded ? <TableSkeleton rows={5} /> : distribution ? <DistributionChart buckets={distribution} /> : <UnavailablePanel icon={Radar} title="Performance distribution unavailable" />}
          </div>
        </div>
      </div>

      <div className="overview-grid dashboard-grid">
        <section className="section" aria-labelledby="top-movers-heading">
          <div className="section-header">
            <h2 className="section-title" id="top-movers-heading">
              Top Movers
            </h2>
          </div>
          {!loaded ? (
            <TableSkeleton rows={6} />
          ) : movers === null ? (
            <UnavailablePanel icon={Users} title="Top movers unavailable" />
          ) : movers.length === 0 ? (
            <EmptyState icon={Users} title="No movers to show" />
          ) : (
            <ul className="top-accounts-list">
              {movers.map((account) => (
                <li key={account.address}>
                  <button type="button" className="top-account-row" onClick={() => open(account)}>
                    <span className="top-account-rank">{account.rank ?? "-"}</span>
                    <Avatar account={account} size={30} />
                    <span className="top-account-identity">
                      <span className="top-account-name">{account.username || account.displayName || shortenAddress(account.address)}</span>
                      <span className="top-account-address">{shortenAddress(account.address)}</span>
                    </span>
                    <span className="top-account-volume text-muted">{formatCompactCurrency(account.volume)}</span>
                    <ArrowUpRight size={15} className="top-account-arrow" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="section" aria-labelledby="recent-activity-heading">
          <div className="section-header">
            <h2 className="section-title" id="recent-activity-heading">
              Recent Activity
            </h2>
          </div>
          {!loaded ? (
            <TableSkeleton rows={8} />
          ) : feed === null ? (
            <UnavailablePanel icon={Activity} title="Recent activity feed unavailable" />
          ) : feed.length === 0 ? (
            <EmptyState icon={Activity} title="No recent activity" />
          ) : (
            <ul className="feed-list">
              {feed.map((item) => (
                <li key={item.id}>
                  <button type="button" className="feed-row" onClick={() => open(item.account)}>
                    <Avatar account={item.account} size={26} />
                    <div className="feed-body">
                      <span className="feed-title">
                        <ActivityTypeBadge type={item.type} />
                        <span className="feed-account">{item.account.username || item.account.displayName || shortenAddress(item.account.address)}</span>
                      </span>
                      <span className="feed-market">{item.market}</span>
                    </div>
                    <div className="feed-meta">
                      <span className="num-cell">{formatCompactCurrency(item.amount)}</span>
                      <span className="feed-time text-muted">
                        {formatPrice(item.price)} · {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="section" aria-labelledby="categories-heading">
        <div className="section-header">
          <h2 className="section-title" id="categories-heading">
            Markets by Category
          </h2>
        </div>
        <div className="card">
          {!loaded ? <TableSkeleton rows={6} /> : categories ? <CategoryBreakdown categories={categories} /> : <UnavailablePanel icon={Boxes} title="Markets by category unavailable" />}
        </div>
      </section>
    </main>
  );
}
