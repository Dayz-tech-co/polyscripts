import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import AccountSearch from "../components/AccountSearch";
import PageHeader from "../components/PageHeader";

const SAMPLE_ACCOUNTS = [
  { label: "swisstony", identifier: "swisstony", hint: "Whale · Obsidian" },
  { label: "Theo4", identifier: "Theo4", hint: "Top PnL" },
  { label: "Fredi9999", identifier: "Fredi9999", hint: "High volume" },
  { label: "kch123", identifier: "kch123", hint: "Active book" },
];

export default function AccountCheckerPage() {
  useEffect(() => {
    document.title = "Account Checker | PolyScripts";
  }, []);

  return (
    <main id="main-content" className="container main-content checker-page">
      <PageHeader
        eyebrow="Tools"
        title="Account Checker"
        description="Drop in any public username or wallet — jump straight into the full analytics profile."
      />

      <section className="checker-hero card" aria-label="Check an account">
        <div className="checker-hero-copy">
          <span className="checker-kicker">
            <Sparkles size={13} aria-hidden="true" />
            Instant lookup
          </span>
          <h2>Who are we checking?</h2>
          <p>Search resolves Polymarket usernames and 0x wallets, then opens portfolio, PnL, positions and activity.</p>
        </div>

        <div className="checker-hero-search">
          <AccountSearch variant="hero" placeholder="Search username or wallet address" />
        </div>

        <div className="checker-samples">
          <span className="checker-samples-label">Try a sample</span>
          <div className="checker-samples-list">
            {SAMPLE_ACCOUNTS.map(({ label, identifier, hint }) => (
              <Link key={identifier} to={`/profile/${encodeURIComponent(identifier)}`} className="checker-chip">
                <span>
                  <strong>{label}</strong>
                  <em>{hint}</em>
                </span>
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
