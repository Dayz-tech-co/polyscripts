import { useEffect, useState } from "react";
import { ArrowUpRight, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { shortenAddress } from "../utils/address";
import { formatTimeAgo } from "../utils/formatters";
import { getWatchlist, removeWatchlistAccount, subscribeToWatchlist } from "../utils/watchlist";

export default function WatchlistSection() {
  const [accounts, setAccounts] = useState(getWatchlist);
  const navigate = useNavigate();

  useEffect(() => subscribeToWatchlist(setAccounts), []);

  return (
    <section className="section watchlist-section" aria-labelledby="watchlist-heading">
      <div className="section-header">
        <div className="watchlist-heading-group">
          <span className="watchlist-heading-icon" aria-hidden="true"><BookmarkCheck size={15} /></span>
          <div>
            <h2 className="section-title" id="watchlist-heading">Your watchlist</h2>
            <p className="section-description">Profiles you are monitoring on this device</p>
          </div>
        </div>
        <span className="watchlist-summary">{accounts.length} saved</span>
      </div>

      {accounts.length === 0 ? (
        <div className="card watchlist-empty">
          <Bookmark size={18} aria-hidden="true" />
          <span>Save traders from their profile to monitor them here.</span>
        </div>
      ) : (
        <ul className="watchlist-list">
          {accounts.map((account) => (
            <li className="watchlist-item" key={account.address}>
              <button
                type="button"
                className="watchlist-open"
                onClick={() => navigate(`/profile/${encodeURIComponent(account.username || account.address)}`)}
              >
                <span className="watchlist-avatar"><Avatar account={account} size={38} radius={0} /></span>
                <span className="top-account-identity">
                  <span className="top-account-name">{account.username || account.displayName || shortenAddress(account.address)}</span>
                  <span className="top-account-address">{shortenAddress(account.address)}</span>
                  {account.addedAt && <span className="watchlist-saved-at">Saved {formatTimeAgo(account.addedAt)}</span>}
                </span>
                <ArrowUpRight size={15} className="watchlist-open-arrow" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="watchlist-remove"
                aria-label={`Remove ${account.username || shortenAddress(account.address)} from watchlist`}
                onClick={() => removeWatchlistAccount(account.address)}
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
