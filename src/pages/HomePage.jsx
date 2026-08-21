import { useEffect } from "react";
import AccountSearch from "../components/AccountSearch";
import RecentAccounts from "../components/RecentAccounts";
import TopAccounts from "../components/TopAccounts";
import TrendingAccounts from "../components/TrendingAccounts";

export default function HomePage() {
  useEffect(() => {
    document.title = "PolyScripts | Polymarket account explorer";
  }, []);

  return (
    <main id="main-content" className="container main-content home-page">
      <section className="home-hero" aria-labelledby="home-brand">
        <h1 id="home-brand" className="home-brand">
          PolyScripts
        </h1>
        <p className="home-lede">
          Public Polymarket account analytics — search a username or wallet.
        </p>
        <div className="home-search">
          <AccountSearch variant="hero" />
        </div>
        <p className="home-examples">
          Examples: <code>swisstony</code> · <code>RWCS</code> · <code>0x3048…7537</code>
        </p>
      </section>

      <div className="home-feed">
        <RecentAccounts />
        <TopAccounts />
        <TrendingAccounts />
      </div>
    </main>
  );
}
