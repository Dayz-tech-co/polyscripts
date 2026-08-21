import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import AccountSearch from "../components/AccountSearch";
import LogoMark from "../components/Logo";
import RecentAccounts from "../components/RecentAccounts";
import TopAccounts from "../components/TopAccounts";
import TrendingAccounts from "../components/TrendingAccounts";

const EXAMPLES = [
  { label: "swisstony", to: "/profile/swisstony" },
  { label: "RWCS", to: "/profile/RWCS" },
  { label: "0x3048…7537", to: "/profile/0x3048d65321be3497164cdfc2996f94f98a2e7537" },
];

export default function HomePage() {
  const searchWrapRef = useRef(null);

  useEffect(() => {
    document.title = "PolyScripts | Polymarket account explorer";
  }, []);

  function focusSearch() {
    const input = searchWrapRef.current?.querySelector("input");
    input?.focus();
  }

  return (
    <main id="main-content" className="container main-content home-page">
      <section className="home-hero" aria-labelledby="home-brand">
        <div className="home-hero-atmosphere" aria-hidden="true" />

        <div className="home-hero-inner">
          <div className="home-hero-brand home-rise" style={{ "--rise-delay": "0ms" }}>
            <LogoMark size={40} className="home-hero-logo" />
            <h1 id="home-brand" className="home-brand">
              PolyScripts
            </h1>
          </div>

          <p className="home-lede home-rise" style={{ "--rise-delay": "80ms" }}>
            Public Polymarket account analytics — search a username or wallet.
          </p>

          <div className="home-search home-rise" style={{ "--rise-delay": "160ms" }} ref={searchWrapRef}>
            <AccountSearch variant="hero" autoFocus={false} />
          </div>

          <div className="home-examples home-rise" style={{ "--rise-delay": "240ms" }}>
            <span className="home-examples-label">Try</span>
            <div className="home-example-chips" role="list">
              {EXAMPLES.map((ex) => (
                <Link key={ex.label} to={ex.to} className="home-example-chip" role="listitem">
                  {ex.label}
                </Link>
              ))}
            </div>
            <button type="button" className="home-examples-focus" onClick={focusSearch}>
              <Search size={12} aria-hidden="true" />
              <span>or type your own</span>
            </button>
          </div>
        </div>
      </section>

      <div className="home-feed home-rise" style={{ "--rise-delay": "320ms" }}>
        <RecentAccounts />
        <TopAccounts />
        <TrendingAccounts />
      </div>
    </main>
  );
}
