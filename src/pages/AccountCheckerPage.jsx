import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search } from "lucide-react";
import AccountSearch from "../components/AccountSearch";
import PageHeader from "../components/PageHeader";

const SAMPLE_ACCOUNTS = [
  { label: "swisstony", identifier: "swisstony" },
  { label: "RWCS", identifier: "RWCS" },
  { label: "marketWizard", identifier: "marketWizard" },
  { label: "ZeroSumHero", identifier: "ZeroSumHero" },
];

export default function AccountCheckerPage() {
  useEffect(() => {
    document.title = "Account Checker | PolyScripts";
  }, []);

  return (
    <main id="main-content" className="container main-content">
      <PageHeader title="Account Checker" description="Inspect the analytics profile of any public account." />

      <section className="checker-panel" aria-label="Check an account">
        <span className="card-label">Enter a username or wallet address</span>
        <div className="checker-search">
          <AccountSearch variant="hero" />
        </div>

        <div className="checker-samples">
          <span className="checker-samples-label">Try a sample account</span>
          <div className="checker-samples-list">
            {SAMPLE_ACCOUNTS.map(({ label, identifier }) => (
              <Link key={identifier} to={`/profile/${encodeURIComponent(identifier)}`} className="chip-link">
                {label}
                <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        <p className="checker-note text-muted">
          <Search size={13} aria-hidden="true" />
          Checker opens the full analytics profile: summary stats, performance, positions and activity.
        </p>
      </section>
    </main>
  );
}