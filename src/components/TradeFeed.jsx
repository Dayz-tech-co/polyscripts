import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookmarkCheck } from "lucide-react";
import Avatar from "./Avatar";
import Badge from "./Badge";
import MarketImage from "./MarketImage";
import { SIGNALS } from "../services/marketService";
import { shortenAddress } from "../utils/address";
import { formatCompactCurrency, formatPrice, formatTimeAgo } from "../utils/formatters";
import { getWatchlist, subscribeToWatchlist, toggleWatchlistAccount } from "../utils/watchlist";
import { useToast } from "../context/toast";

function walletLabel(account) {
  return account.username || account.displayName || shortenAddress(account.address);
}

/**
 * Live trade tape row list. Used by the whale feed, market pages, the
 * dashboard pulse and the watchlist feed.
 */
function useWatched() {
  const [set, setSet] = useState(() => new Set(getWatchlist().map((a) => a.address?.toLowerCase())));
  useEffect(() => subscribeToWatchlist((list) => setSet(new Set(list.map((a) => a.address?.toLowerCase())))), []);
  return set;
}

export default function TradeFeed({ trades, showMarket = true, showWallet = true, freshIds, compact = false }) {
  const watched = useWatched();
  const { showToast } = useToast();

  function follow(event, account) {
    event.preventDefault();
    const added = toggleWatchlistAccount(account);
    showToast(added ? `Following ${walletLabel(account)}` : `Unfollowed ${walletLabel(account)}`);
  }

  return (
    <ol className={`trade-feed stagger ${compact ? "is-compact" : ""} ${showWallet ? "" : "no-wallet"}`}>
      {trades.map((trade, index) => (
        <li key={trade.id} className={`trade-row ${freshIds?.has(trade.id) ? "is-fresh" : ""}`} style={{ "--i": Math.min(index, 14) }}>
          {showWallet && (
            <div className="trade-wallet">
              <Link className="trade-wallet-link" to={`/profile/${encodeURIComponent(trade.wallet)}`}>
                <Avatar account={trade.account} size={28} />
                <span className="trade-wallet-text">
                  <strong>{walletLabel(trade.account)}</strong>
                  {trade.marketsTraded != null && <span>{trade.marketsTraded.toLocaleString("en-US")} markets</span>}
                </span>
              </Link>
              {trade.wallet && (
                <button
                  type="button"
                  className={`trade-follow ${watched.has(trade.wallet.toLowerCase()) ? "is-on" : ""}`}
                  onClick={(e) => follow(e, trade.account)}
                  aria-label={watched.has(trade.wallet.toLowerCase()) ? `Unfollow ${walletLabel(trade.account)}` : `Follow ${walletLabel(trade.account)}`}
                  title={watched.has(trade.wallet.toLowerCase()) ? "Following" : "Follow wallet"}
                >
                  {watched.has(trade.wallet.toLowerCase()) ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                </button>
              )}
            </div>
          )}
          <span className={`trade-side is-${trade.side === "SELL" ? "sell" : "buy"}`}>{trade.side === "SELL" ? "Sell" : "Buy"}</span>
          <div className="trade-market">
            {showMarket ? (
              <Link to={`/market/${encodeURIComponent(trade.slug || trade.conditionId)}`} className="trade-market-link">
                <MarketImage icon={trade.icon} tag={trade.title?.slice(0, 3).toUpperCase()} size={22} radius={5} />
                <span className="trade-market-title">{trade.title}</span>
              </Link>
            ) : null}
            <span className="trade-market-meta">
              <span className="trade-outcome">{trade.outcome || "-"}</span>
              <span>@ {formatPrice(trade.price)}</span>
              {trade.signals?.map((key) => (
                <Badge key={key} label={SIGNALS[key].label} tone={SIGNALS[key].tone} hint={SIGNALS[key].hint} />
              ))}
            </span>
          </div>
          <span className="trade-notional">{formatCompactCurrency(trade.notional)}</span>
          <time className="trade-time" dateTime={trade.timestamp ? new Date(trade.timestamp).toISOString() : undefined}>
            {trade.timestamp ? formatTimeAgo(trade.timestamp) : ""}
          </time>
        </li>
      ))}
    </ol>
  );
}
