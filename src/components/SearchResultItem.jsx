import { BadgeCheck } from "lucide-react";
import Avatar from "./Avatar";
import { shortenAddress } from "../utils/address";
import { formatCompactCurrency, formatNumber, formatSignedCurrency } from "../utils/formatters";
import { getToneClass } from "../utils/states";

export default function SearchResultItem({ account, active, id, onSelect, onMouseEnter }) {
  const hasUsername = Boolean(account.username);
  const primary = account.username || account.displayName || shortenAddress(account.address);
  const secondary = hasUsername || account.displayName ? shortenAddress(account.address) : "Wallet account";
  const hasMeta = account.pnl != null || account.volume != null || account.rank != null;

  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      className={`search-result-item ${active ? "is-active" : ""}`}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(account);
      }}
      onMouseEnter={onMouseEnter}
    >
      <Avatar account={account} size={32} radius={9} />
      <div className="search-result-text">
        <span className="search-result-primary">
          {primary}
          {account.verified && <BadgeCheck size={13} className="verified-badge" aria-label="Verified" />}
        </span>
        <span className="search-result-secondary">{secondary}</span>
      </div>
      {hasMeta && (
        <div className="search-result-meta">
          {account.rank != null && <span className="search-result-rank">#{formatNumber(account.rank)}</span>}
          {account.pnl != null && (
            <span className={`search-result-pnl ${getToneClass(account.pnl)}`}>
              {formatSignedCurrency(account.pnl, { decimals: 0 })}
            </span>
          )}
          {account.pnl == null && account.volume != null && (
            <span className="search-result-pnl text-muted">{formatCompactCurrency(account.volume)} vol</span>
          )}
        </div>
      )}
    </li>
  );
}
