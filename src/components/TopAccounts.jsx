import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Users } from "lucide-react";
import Filters from "./Filters";
import Avatar from "./Avatar";
import ErrorState from "./ErrorState";
import { TableSkeleton } from "./Skeleton";
import { getTopAccounts } from "../services/polymarketService";
import { shortenAddress } from "../utils/address";
import { formatCompactCurrency, formatSignedCurrency } from "../utils/formatters";

const PERIODS = [
  { label: "Daily", value: "DAY" },
  { label: "Weekly", value: "WEEK" },
  { label: "Monthly", value: "MONTH" },
  { label: "All Time", value: "ALL" },
];

const ORDER_OPTIONS = [
  { label: "PnL", value: "PNL" },
  { label: "Volume", value: "VOL" },
];

export default function TopAccounts({ title = "Top Accounts", limit = 8, showOrderToggle = false, headingId = "top-accounts-heading" }) {
  const [period, setPeriod] = useState("DAY");
  const [orderBy, setOrderBy] = useState("PNL");
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setAccounts(null);
    setError(false);
    getTopAccounts({ timePeriod: period, orderBy, limit })
      .then((list) => {
        if (active) setAccounts(list);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [period, orderBy, limit, reloadToken]);

  function open(account) {
    navigate(`/profile/${encodeURIComponent(account.username || account.address)}`);
  }

  return (
    <section className="section top-accounts" aria-labelledby={headingId}>
      <div className="section-header">
        <h2 className="section-title" id={headingId}>
          {title}
        </h2>
        <div className="section-actions">
          {showOrderToggle && (
            <Filters
              options={ORDER_OPTIONS.map((o) => o.label)}
              active={ORDER_OPTIONS.find((o) => o.value === orderBy)?.label}
              onChange={(label) => setOrderBy(ORDER_OPTIONS.find((o) => o.label === label)?.value || "PNL")}
              ariaLabel="Sort leaderboard by"
            />
          )}
          <Filters
            options={PERIODS.map((p) => p.label)}
            active={PERIODS.find((p) => p.value === period)?.label}
            onChange={(label) => setPeriod(PERIODS.find((p) => p.label === label)?.value || "DAY")}
            ariaLabel="Leaderboard time range"
          />
        </div>
      </div>

      {error ? (
        <ErrorState title="Unable to load top accounts" description="Please try again." onRetry={() => setReloadToken((t) => t + 1)} />
      ) : accounts === null ? (
        <TableSkeleton rows={Math.min(limit, 6)} />
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <Users size={20} strokeWidth={1.5} className="empty-state-icon" aria-hidden="true" />
          <p className="empty-state-title">No ranked accounts for this period</p>
        </div>
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
                {account.volume != null && (
                  <span className="top-account-volume text-muted">{formatCompactCurrency(account.volume)}</span>
                )}
                {account.pnl != null && (
                  <span className={`top-account-pnl tone-${account.pnl >= 0 ? "positive" : "negative"}`}>
                    {formatSignedCurrency(account.pnl, { decimals: 0 })}
                  </span>
                )}
                <ArrowUpRight size={15} className="top-account-arrow" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
