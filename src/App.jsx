import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import Header from "./components/Header";
import ProfileHeader from "./components/ProfileHeader";
import ProfileStats from "./components/ProfileStats";
import ProfileTabs from "./components/ProfileTabs";
import PerformanceCard from "./components/PerformanceCard";
import PortfolioSummary from "./components/PortfolioSummary";
import PositionsSection from "./components/PositionsSection";
import ActivitySection from "./components/ActivitySection";
import PositionsTab from "./components/PositionsTab";
import HistoryTab from "./components/HistoryTab";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import { ToastProvider } from "./context/ToastContext";
import { getProfileBundle } from "./services/profileService";

function AppContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [activeNav, setActiveNav] = useState("Overview");
  const [activeTab, setActiveTab] = useState("Overview");
  const [positionsQuery, setPositionsQuery] = useState("");

  const overviewRef = useRef(null);
  const marketsRef = useRef(null);
  const analyticsRef = useRef(null);

  function loadData() {
    setLoading(true);
    setError(false);
    getProfileBundle()
      .then((bundle) => {
        setData(bundle);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleNavChange(item) {
    setActiveNav(item);
    if (item === "Overview") {
      setActiveTab("Overview");
      overviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (item === "Markets") {
      setActiveTab("Positions");
      requestAnimationFrame(() => marketsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } else if (item === "Analytics") {
      setActiveTab("Overview");
      requestAnimationFrame(() => analyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  function handleSearchChange(value) {
    setPositionsQuery(value);
    if (value.trim()) {
      setActiveTab("Positions");
      setActiveNav("Markets");
    }
  }

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <Header
        activeNav={activeNav}
        onNavChange={handleNavChange}
        searchQuery={positionsQuery}
        onSearchChange={handleSearchChange}
      />

      <div id="top" ref={overviewRef} />

      <ProfileHeader profile={data?.profile} loading={loading} />

      <main id="main-content" className="container main-content">
        <ProfileStats stats={data?.stats} loading={loading} />

        {error ? (
          <div className="error-state">
            <p className="error-state-title">Unable to load profile data</p>
            <button type="button" className="btn btn-secondary" onClick={loadData}>
              <RefreshCw size={14} aria-hidden="true" />
              <span>Try Again</span>
            </button>
          </div>
        ) : (
          <>
            <ProfileTabs active={activeTab} onChange={setActiveTab} />

            {activeTab === "Overview" && (
              <div className="tab-panel" id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
                <div className="overview-grid" ref={analyticsRef}>
                  <PerformanceCard />
                  <PortfolioSummary summary={data?.portfolioSummary} loading={loading} />
                </div>

                <div ref={marketsRef}>
                  <PositionsSection positions={data?.openPositions} loading={loading} limit={6} />
                </div>

                <ActivitySection activity={data?.recentActivity} loading={loading} limit={8} />
              </div>
            )}

            {activeTab === "Positions" && (
              <div className="tab-panel" id="panel-positions" role="tabpanel" aria-labelledby="tab-positions">
                <PositionsTab
                  openPositions={data?.openPositions}
                  resolvedPositions={data?.resolvedPositions}
                  loading={loading}
                  query={positionsQuery}
                  onQueryChange={setPositionsQuery}
                />
              </div>
            )}

            {activeTab === "Activity" && (
              <div className="tab-panel" id="panel-activity" role="tabpanel" aria-labelledby="tab-activity">
                <ActivitySection activity={data?.recentActivity} loading={loading} />
              </div>
            )}

            {activeTab === "History" && (
              <div className="tab-panel" id="panel-history" role="tabpanel" aria-labelledby="tab-history">
                <HistoryTab resolvedPositions={data?.resolvedPositions} loading={loading} />
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
