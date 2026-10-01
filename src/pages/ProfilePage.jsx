import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Home, SearchX } from "lucide-react";
import ProfileHero from "../components/ProfileHero";
import ProfileTabs from "../components/ProfileTabs";
import OverviewStatsPanel from "../components/OverviewStatsPanel";
import OverviewWorkspace from "../components/OverviewWorkspace";
import MarketExposure from "../components/MarketExposure";
import SmartScoreCard from "../components/SmartScoreCard";
import PositionsSection from "../components/PositionsSection";
import ActivitySection from "../components/ActivitySection";
import PositionsTab from "../components/PositionsTab";
import HistoryTab from "../components/HistoryTab";
import ErrorState from "../components/ErrorState";
import AccountSearch from "../components/AccountSearch";
import PageLoader from "../components/PageLoader";
import { useProfile } from "../hooks/useProfile";
import { shortenAddress } from "../utils/address";
import { validateProfileData, logDataIntegrity } from "../utils/dataIntegrity";
import { addRecentAccount } from "../utils/recentSearches";

export default function ProfilePage() {
  const { identifier } = useParams();
  const { status, data, detailsStatus, retry } = useProfile(identifier);
  const [activeTab, setActiveTab] = useState("Overview");
  const [positionsQuery, setPositionsQuery] = useState("");

  useEffect(() => {
    setActiveTab("Overview");
    setPositionsQuery("");
  }, [identifier]);

  const activePositions = useMemo(
    () => (data?.positions ? data.positions.filter((p) => p.isActive) : null),
    [data?.positions],
  );

  useEffect(() => {
    if (import.meta.env.DEV && status === "success" && data) {
      logDataIntegrity(
        validateProfileData({
          stats: data.stats,
          positions: data.positions,
          resolvedPositions: data.resolvedPositions,
        }),
      );
    }
  }, [status, data]);

  useEffect(() => {
    if (status === "success" && data?.account) {
      addRecentAccount(data.account);
      const label = data.account.username || shortenAddress(data.account.address);
      document.title = `${label} | PolyScripts`;
    } else if (status === "not-found") {
      document.title = "Account not found | PolyScripts";
    } else {
      document.title = "PolyScripts | Polymarket Bots, Strategies & Education";
    }
  }, [status, data]);

  if (status === "not-found") {
    return (
      <main id="main-content" className="container main-content">
        <div className="status-page">
          <SearchX size={28} strokeWidth={1.5} className="status-page-icon" aria-hidden="true" />
          <h1 className="status-page-title">Account not found</h1>
          <p className="status-page-description">
            We couldn&apos;t find a public account matching this username or address.
          </p>
          <div className="status-page-search">
            <AccountSearch variant="hero" placeholder="Search another account" />
          </div>
          <div className="status-page-actions">
            <Link to="/" className="btn btn-secondary">
              <Home size={14} aria-hidden="true" />
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main id="main-content" className="container main-content">
        <ErrorState title="Unable to load this profile" description="Please try again." onRetry={retry} />
      </main>
    );
  }

  const loading = status === "loading";
  const historyLoading = loading || detailsStatus === "loading";
  const account = data?.account ?? null;
  const stats = data?.stats ?? null;
  const chartKey = account?.address || identifier;

  if (loading && !data) {
    return (
      <main id="main-content" className="container main-content">
        <PageLoader label="Loading profile" detail="Resolving wallet, open positions and leaderboard stats" />
      </main>
    );
  }

  return (
    <>
      <ProfileHero
        account={account}
        stats={stats}
        pnlSeries={data?.pnlSeries}
        activity={data?.activity}
        loading={loading}
        detailsLoading={historyLoading}
        onRefresh={retry}
      />

      <main id="main-content" className="container main-content profile-main">
        <ProfileTabs
          active={activeTab}
          onChange={setActiveTab}
          counts={{
            Positions: historyLoading ? null : (activePositions?.length ?? null),
            Activity: historyLoading ? null : (data?.activity?.length ?? 0),
            History: historyLoading ? null : (data?.resolvedPositions?.length ?? 0),
          }}
        />

        {detailsStatus === "error" && (
          <div className="profile-hydrate-banner" role="status">
            <span>Some history failed to load (resolved trades / activity / PnL series).</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={retry}>
              Retry
            </button>
          </div>
        )}

        {activeTab === "Overview" && (
          <div className="tab-panel" id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
            <div className="overview-gravia">
              <OverviewWorkspace
                key={chartKey}
                identifier={chartKey}
                stats={stats}
                resolvedPositions={data?.resolvedPositions}
                activity={data?.activity}
                performanceSeries={data?.pnlSeries || undefined}
                positions={activePositions}
                loading={historyLoading}
                defaultView="calendar"
              />
              <OverviewStatsPanel
                stats={stats}
                resolvedPositions={data?.resolvedPositions}
                activity={data?.activity}
                loading={historyLoading}
              />
            </div>

            <div className="overview-feed">
              <PositionsSection positions={activePositions} loading={historyLoading} limit={5} />
              <ActivitySection activity={data?.activity} loading={historyLoading} limit={6} />
            </div>
          </div>
        )}

        {activeTab === "Positions" && (
          <div className="tab-panel" id="panel-positions" role="tabpanel" aria-labelledby="tab-positions">
            <PositionsTab
              openPositions={data?.positions}
              resolvedPositions={data?.resolvedPositions}
              loading={loading || historyLoading}
              query={positionsQuery}
              onQueryChange={setPositionsQuery}
            />
          </div>
        )}

        {activeTab === "Activity" && (
          <div className="tab-panel" id="panel-activity" role="tabpanel" aria-labelledby="tab-activity">
            <ActivitySection activity={data?.activity} loading={historyLoading} />
          </div>
        )}

        {activeTab === "Categories" && (
          <div className="tab-panel" id="panel-categories" role="tabpanel" aria-labelledby="tab-categories">
            <div className="categories-layout">
              <MarketExposure positions={activePositions} loading={historyLoading} />
              <SmartScoreCard key={`smart-${chartKey}`} data={data} loading={historyLoading} />
            </div>
          </div>
        )}

        {activeTab === "Analytics" && (
          <div className="tab-panel" id="panel-analytics" role="tabpanel" aria-labelledby="tab-analytics">
            <OverviewWorkspace
              key={`analytics-${chartKey}`}
              identifier={chartKey}
              stats={stats}
              resolvedPositions={data?.resolvedPositions}
              activity={data?.activity}
              performanceSeries={data?.pnlSeries || undefined}
              positions={activePositions}
              loading={historyLoading}
              defaultView="chart"
            />
          </div>
        )}

        {activeTab === "History" && (
          <div className="tab-panel" id="panel-history" role="tabpanel" aria-labelledby="tab-history">
            <HistoryTab resolvedPositions={data?.resolvedPositions} loading={historyLoading} />
          </div>
        )}
      </main>
    </>
  );
}
