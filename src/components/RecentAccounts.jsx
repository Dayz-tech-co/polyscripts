import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Clock3 } from "lucide-react";
import Avatar from "./Avatar";
import { clearRecentAccounts, getRecentAccounts } from "../utils/recentSearches";
import { shortenAddress } from "../utils/address";

export default function RecentAccounts() {
  const [accounts, setAccounts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setAccounts(getRecentAccounts());
  }, []);

  if (accounts.length === 0) return null;

  function open(account) {
    navigate(`/profile/${encodeURIComponent(account.username || account.address)}`);
  }

  return (
    <section className="section" aria-labelledby="recently-viewed-heading">
      <div className="section-header">
        <div className="section-title-group">
          <Clock3 size={16} className="section-title-icon" aria-hidden="true" />
          <h2 className="section-title" id="recently-viewed-heading">
            Recently Viewed
          </h2>
        </div>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            clearRecentAccounts();
            setAccounts([]);
          }}
        >
          Clear
        </button>
      </div>

      <ul className="top-accounts-list">
        {accounts.map((account) => (
          <li key={account.address}>
            <button type="button" className="top-account-row" onClick={() => open(account)}>
              <Avatar account={account} size={30} radius={9} />
              <span className="top-account-identity">
                <span className="top-account-name">{account.username || account.displayName || shortenAddress(account.address)}</span>
                <span className="top-account-address">{shortenAddress(account.address)}</span>
              </span>
              <span className="top-account-pnl text-muted">Reopened</span>
              <ChevronRight size={15} className="top-account-arrow" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}