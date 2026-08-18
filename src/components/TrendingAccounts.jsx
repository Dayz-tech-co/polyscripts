import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Flame, SearchX } from "lucide-react";
import Avatar from "./Avatar";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";
import { getTrendingAccounts } from "../services/ecosystemService";
import { shortenAddress } from "../utils/address";
import { formatCompactCurrency } from "../utils/formatters";

export default function TrendingAccounts({ limit = 5 }) {
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    getTrendingAccounts({ limit })
      .then((list) => active && setAccounts(list))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [limit]);

  function open(account) {
    navigate(`/profile/${encodeURIComponent(account.username || account.address)}`);
  }

  return (
    <section className="section" aria-labelledby="trending-heading">
      <div className="section-header">
        <div className="section-title-group">
          <Flame size={16} className="section-title-icon" aria-hidden="true" />
          <h2 className="section-title" id="trending-heading">
            Trending Accounts
          </h2>
        </div>
      </div>

      {error ? (
        <EmptyState icon={SearchX} title="Unable to load trending accounts" description="Please try again." />
      ) : accounts === null ? (
        <TableSkeleton rows={5} />
      ) : accounts.length === 0 ? (
        <EmptyState icon={Flame} title="No trending accounts right now" />
      ) : (
        <ul className="top-accounts-list">
          {accounts.map((account) => (
            <li key={account.address}>
              <button type="button" className="top-account-row" onClick={() => open(account)}>
                <span className="top-account-rank">{account.rank ?? "-"}</span>
                <Avatar account={account} size={30} radius={9} />
                <span className="top-account-identity">
                  <span className="top-account-name">{account.username || account.displayName || shortenAddress(account.address)}</span>
                  <span className="top-account-address">{shortenAddress(account.address)}</span>
                </span>
                <span className="top-account-volume text-muted">{formatCompactCurrency(account.volume)}</span>
                <span className="top-account-pnl tone-positive">{formatCompactCurrency(account.pnl)}</span>
                <ChevronRight size={15} className="top-account-arrow" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}