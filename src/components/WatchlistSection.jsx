import { useEffect, useState } from "react";
import { Bookmark, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { shortenAddress } from "../utils/address";
import { getWatchlist, removeWatchlistAccount, subscribeToWatchlist } from "../utils/watchlist";

export default function WatchlistSection() {
  const [accounts, setAccounts] = useState(getWatchlist);
  const navigate = useNavigate();

  useEffect(() => subscribeToWatchlist(setAccounts), []);

  return (
    <section className="section watchlist-section" aria-labelledby="watchlist-heading">
      <div className="section-header">
        <div>
          <h2 className="section-title" id="watchlist-heading">Watchlist</h2>
          <p className="section-description">Traders saved on this device</p>
        </div>
        <span className="section-count">{accounts.length}</span>
      </div>

      {accounts.length === 0 ? (
        <div className="card watchlist-empty">
          <Bookmark size={18} aria-hidden="true" />
          <span>Save traders from their profile to monitor them here.</span>
        </div>
      ) : (
        <ul className="card watchlist-list">
          {accounts.map((account) => (
            <li className="watchlist-item" key={account.address}>
              <button
                type="button"
                className="watchlist-open"
                onClick={() => navigate(`/profile/${encodeURIComponent(account.username || account.address)}`)}
              >
                <Avatar account={account} size={32} radius={0} />
                <span className="top-account-identity">
                  <span className="top-account-name">{account.username || account.displayName || shortenAddress(account.address)}</span>
                  <span className="top-account-address">{shortenAddress(account.address)}</span>
                </span>
              </button>
              <button
                type="button"
                className="icon-btn icon-btn-sm"
                aria-label={`Remove ${account.username || shortenAddress(account.address)} from watchlist`}
                onClick={() => removeWatchlistAccount(account.address)}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
