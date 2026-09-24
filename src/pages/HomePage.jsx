import { useEffect } from "react";
import AccountSearch from "../components/AccountSearch";
import RecentAccounts from "../components/RecentAccounts";
import TopAccounts from "../components/TopAccounts";
import TrendingAccounts from "../components/TrendingAccounts";
import HomeLive from "../components/HomeLive";

export default function HomePage() {
  useEffect(() => {
    document.title = "PolyScripts | Polymarket account explorer";
  }, []);

  return (
    <main id="main-content" className="container main-content home-page">
      <section className="home-hero" aria-labelledby="home-brand">
        <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
        <h1 id="home-brand" className="home-brand shimmer-text">
          PolyScripts
        </h1>
        <p className="home-lede">
          Live whale trades, smart-money signals and trader analytics for Polymarket.
        </p>
        <div className="home-search">
          <AccountSearch variant="hero" />
        </div>
        <p className="home-examples">
          Examples: <code>swisstony</code> · <code>RWCS</code> · <code>0x3048…7537</code>
          <span className="home-kbd-hint">or press <kbd>⌘K</kbd> to search everything</span>
        </p>
      </section>

      <HomeLive />

      <div className="home-feed" data-reveal>
        <RecentAccounts />
        <TopAccounts />
        <TrendingAccounts />
      </div>
    </main>
  );
}
