import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Home, SearchX } from "lucide-react";
import ProfileHeader from "../components/ProfileHeader";
import ProfileStats from "../components/ProfileStats";
import ProfileTabs from "../components/ProfileTabs";
import PerformanceCard from "../components/PerformanceCard";
import MonthlyPerformanceCalendar from "../components/MonthlyPerformanceCalendar";
import PositionsSection from "../components/PositionsSection";
import ActivitySection from "../components/ActivitySection";
import PositionsTab from "../components/PositionsTab";
import HistoryTab from "../components/HistoryTab";
import ErrorState from "../components/ErrorState";
import AccountSearch from "../components/AccountSearch";
import { useProfile } from "../hooks/useProfile";
import { shortenAddress } from "../utils/address";
import { validateProfileData, logDataIntegrity } from "../utils/dataIntegrity";

export default function ProfilePage() {
  const { identifier } = useParams();
  const { status, data, retry } = useProfile(identifier);
  const [activeTab, setActiveTab] = useState("Overview");
  const [positionsQuery, setPositionsQuery] = useState("");

  useEffect(() => {
    setActiveTab("Overview");
    setPositionsQuery("");
  }, [identifier]);

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
        <ErrorState
          title="Unable to load this profile"
          description="Please try again."
          onRetry={retry}
        />
      </main>
    );
  }

  const loading = status === "loading";
  const account = data?.account ?? null;
  const stats = data?.stats ?? null;

  return (
    <>
      <ProfileHeader account={account} loading={loading} />

      <main id="main-content" className="container main-content">
        <ProfileStats stats={stats} loading={loading} />

        <ProfileTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === "Overview" && (
          <div className="tab-panel" id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
            <div className="overview-stack">
              <PerformanceCard key={account?.address || identifier} identifier={account?.address || identifier} />

              <MonthlyPerformanceCalendar
                resolvedPositions={data?.resolvedPositions}
                activity={data?.activity}
                loading={loading}
              />

              <PositionsSection positions={data?.positions} loading={loading} limit={6} />
              <ActivitySection activity={data?.activity} loading={loading} limit={8} />
            </div>
          </div>
        )}

        {activeTab === "Positions" && (
          <div className="tab-panel" id="panel-positions" role="tabpanel" aria-labelledby="tab-positions">
            <PositionsTab
              openPositions={data?.positions}
              resolvedPositions={data?.resolvedPositions}
              loading={loading}
              query={positionsQuery}
              onQueryChange={setPositionsQuery}
            />
          </div>
        )}

        {activeTab === "Activity" && (
          <div className="tab-panel" id="panel-activity" role="tabpanel" aria-labelledby="tab-activity">
            <ActivitySection activity={data?.activity} loading={loading} />
          </div>
        )}

        {activeTab === "History" && (
          <div className="tab-panel" id="panel-history" role="tabpanel" aria-labelledby="tab-history">
            <HistoryTab resolvedPositions={data?.resolvedPositions} loading={loading} />
          </div>
        )}
      </main>
    </>
  );
}
