import { useEffect } from "react";
import { BarChart3, Search, ShieldCheck } from "lucide-react";
import AccountSearch from "../components/AccountSearch";
import TopAccounts from "../components/TopAccounts";

const CAPABILITIES = [
  {
    icon: Search,
    title: "Find any account",
    description: "Look up a public Polymarket account by username or wallet address in seconds.",
  },
  {
    icon: BarChart3,
    title: "Public analytics",
    description: "Positions, activity and trading volume derived from real, publicly available data.",
  },
  {
    icon: ShieldCheck,
    title: "Read only, always",
    description: "A research and analytics interface only. No trading, wallets or logins involved.",
  },
];

export default function HomePage() {
  useEffect(() => {
    document.title = "PolyScripts | Polymarket Bots, Strategies & Education";
  }, []);

  return (
    <main id="main-content" className="container main-content">
      <section className="hero">
        <span className="hero-eyebrow">Polymarket account explorer</span>
        <h1 className="hero-title">Find any public Polymarket account</h1>
        <p className="hero-subtitle">Search by username or wallet address to view public statistics, positions and activity.</p>
        <div className="hero-search-wrap">
          <AccountSearch variant="hero" />
        </div>
        <p className="hero-hint">
          Try <code>swisstony</code> or <code>0x3048d65321be3497164cdfc2996f94f98a2e7537</code>
        </p>
      </section>

      <div className="home-sections">
        <TopAccounts />

        <section className="section" aria-labelledby="capabilities-heading">
          <h2 className="section-title" id="capabilities-heading">
            What you can do
          </h2>
          <div className="capability-grid">
            {CAPABILITIES.map(({ icon: Icon, title, description }) => (
              <div className="capability-card" key={title}>
                <span className="capability-icon">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <h3 className="capability-title">{title}</h3>
                <p className="capability-description">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
