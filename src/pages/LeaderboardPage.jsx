import { useEffect } from "react";
import TopAccounts from "../components/TopAccounts";

export default function LeaderboardPage() {
  useEffect(() => {
    document.title = "Explore traders | PolyScripts";
  }, []);

  return (
    <main id="main-content" className="container main-content">
      <div className="leaderboard-page">
        <div className="leaderboard-page-head">
          <div>
            <h1 className="leaderboard-page-title">Explore Traders</h1>
            <p className="leaderboard-page-subtitle">Ranked public Polymarket accounts by profit/loss or volume.</p>
          </div>
        </div>

        <TopAccounts title="Top Traders" limit={25} showOrderToggle headingId="explore-heading" />
      </div>
    </main>
  );
}
