import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Crown,
  Gem,
  Hexagon,
  RefreshCw,
  Share2,
  Shield,
  Zap,
} from "lucide-react";
import Avatar from "./Avatar";
import Tooltip from "./Tooltip";
import PolymarketIcon from "./PolymarketIcon";
import PnlSparkline from "./PnlSparkline";
import AnimatedNumber from "./AnimatedNumber";
import { ProfileHeaderSkeleton } from "./Skeleton";
import { shortenAddress } from "../utils/address";
import { useToast } from "../context/toast";
import { isAccountWatched, subscribeToWatchlist, toggleWatchlistAccount } from "../utils/watchlist";
import {
  formatCompactCurrency,
  formatSignedCurrency,
} from "../utils/formatters";
import { getToneClass, getValueState } from "../utils/states";

const TIER_ICONS = {
  "Tier 0": Award,
  Bronze: Award,
  Silver: Shield,
  Gold: Zap,
  Platinum: Crown,
  Diamond: Gem,
  Obsidian: Hexagon,
};

const SPARK_RANGES = ["1D", "1W", "1M", "3M", "ALL"];

function tierCssSlug(tierName, tier) {
  if (tier != null && Number.isFinite(tier)) return String(tier);
  if (!tierName) return "0";
  return String(tierName).toLowerCase().replace(/\s+/g, "-");
}

function sliceSeries(series, range) {
  if (!Array.isArray(series) || series.length === 0) return [];
  if (range === "ALL") return series;
  const days = range === "1D" ? 1 : range === "1W" ? 7 : range === "1M" ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const sliced = series.filter((p) => new Date(p.date).getTime() >= cutoff);
  const window = sliced.length >= 2 ? sliced : series.slice(-Math.min(series.length, 24));
  // Rebase so the period spark shows movement, not a flat absolute PnL strip.
  const baseline = window[0]?.value;
  if (!Number.isFinite(baseline)) return window;
  return window.map((p) => ({ ...p, value: p.value - baseline }));
}

function volumeSplit(activity) {
  let buy = 0;
  let sell = 0;
  for (const item of activity || []) {
    const amt = Number(item.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    if (item.type === "Bought") buy += amt;
    else if (item.type === "Sold") sell += amt;
  }
  return { buy, sell };
}

export default function ProfileHero({
  account,
  stats,
  pnlSeries,
  activity,
  loading,
  detailsLoading,
  onRefresh,
}) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [watched, setWatched] = useState(() => isAccountWatched(account?.address));
  const [sparkRange, setSparkRange] = useState("ALL");

  useEffect(() => {
    setWatched(isAccountWatched(account?.address));
    return subscribeToWatchlist(() => setWatched(isAccountWatched(account?.address)));
  }, [account?.address]);

  const sparkPoints = useMemo(() => sliceSeries(pnlSeries, sparkRange), [pnlSeries, sparkRange]);
  const sparkTone = useMemo(() => {
    if (sparkPoints.length < 2) return getValueState(stats?.pnl);
    return getValueState(sparkPoints[sparkPoints.length - 1].value - sparkPoints[0].value);
  }, [sparkPoints, stats?.pnl]);

  const split = useMemo(() => volumeSplit(activity), [activity]);
  const splitTotal = split.buy + split.sell;

  if (loading || !account) {
    return (
      <section className="profile-hero" aria-label="Profile">
        <div className="container">
          <ProfileHeaderSkeleton />
        </div>
      </section>
    );
  }

  const hasUsername = Boolean(account.username);
  const primary = hasUsername ? account.username : account.displayName || shortenAddress(account.address);
  const secondary = hasUsername || account.displayName ? shortenAddress(account.address) : "Public account";
  const profileIdentifier = hasUsername ? account.username : account.address;
  const profileUrl = `https://polymarket.com/profile/${encodeURIComponent(profileIdentifier)}`;
  const tierLabel = account.tierName || null;
  const TierIcon = tierLabel && TIER_ICONS[tierLabel] ? TIER_ICONS[tierLabel] : Award;
  const tierSlug = tierLabel ? tierCssSlug(tierLabel, account.tier) : null;
  const pnlTone = getToneClass(stats?.pnl);
  const cash = stats?.cashBalance;
  const positionsValue = stats?.activePositionsValue ?? stats?.positionsValue;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      showToast("Address copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast("Unable to copy address");
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${primary} | PolyScripts`, url });
        return;
      } catch {
        // cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Profile link copied");
    } catch {
      showToast("Unable to copy link");
    }
  }

  function handleWatchlist() {
    const next = toggleWatchlistAccount(account);
    setWatched(next);
    showToast(next ? "Added to watchlist" : "Removed from watchlist");
  }

  return (
    <section className="profile-hero" aria-label="Profile overview">
      <div className="container profile-hero-inner">
        <div className="profile-hero-identity">
          <Avatar account={account} size={52} />
          <div className="profile-hero-identity-text">
            <div className="profile-name-row">
              <h1 className="profile-name">
                <a href={profileUrl} target="_blank" rel="noreferrer noopener" title="Open on Polymarket">
                  {primary}
                </a>
              </h1>
              {account.verified && (
                <Tooltip label="Verified profile" position="bottom">
                  <span className="profile-badge-hit" tabIndex={0} aria-label="Verified">
                    <BadgeCheck size={15} className="verified-badge" aria-hidden="true" />
                  </span>
                </Tooltip>
              )}
            </div>

            <div className="profile-hero-meta">
              <span className="address-pill">{secondary}</span>
              {tierLabel && (
                <span className={`tier-badge tier-${tierSlug}`}>
                  <TierIcon size={11} aria-hidden="true" />
                  {tierLabel}
                </span>
              )}
              {stats?.rank != null && <span className="hero-chip">Rank #{stats.rank}</span>}
            </div>

            <div className="profile-hero-actions">
              <Tooltip label={copied ? "Copied" : "Copy address"}>
                <button type="button" className="icon-btn icon-btn-sm" onClick={handleCopy} aria-label="Copy address">
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </Tooltip>
              <Tooltip label={watched ? "Watching" : "Watch"}>
                <button
                  type="button"
                  className={`icon-btn icon-btn-sm ${watched ? "is-active" : ""}`}
                  onClick={handleWatchlist}
                  aria-pressed={watched}
                  aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
                >
                  {watched ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                </button>
              </Tooltip>
              <Tooltip label="Share profile">
                <button type="button" className="icon-btn icon-btn-sm" onClick={handleShare} aria-label="Share">
                  <Share2 size={13} />
                </button>
              </Tooltip>
              <a className="btn btn-primary hero-cta" href={profileUrl} target="_blank" rel="noreferrer noopener">
                <PolymarketIcon size={14} />
                <span>Open on Polymarket</span>
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
              {watched && (
                <Link className="watchlist-view-link" to="/dashboard">
                  Watchlist
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="profile-hero-metrics" aria-label="Account metrics">
          <div className="hero-metric">
            <span className="hero-metric-label">Portfolio</span>
            <span className="hero-metric-value">
              {stats?.portfolioValue != null ? formatCompactCurrency(stats.portfolioValue) : detailsLoading ? "…" : "N/A"}
            </span>
            <span className="hero-metric-sub">
              {cash != null ? formatCompactCurrency(cash) : "—"} Cash
              {" / "}
              {positionsValue != null ? formatCompactCurrency(positionsValue) : "—"} Pos
            </span>
          </div>

          <div className="hero-metric">
            <span className="hero-metric-label">Volume</span>
            <span className="hero-metric-value">
              {stats?.volume != null ? formatCompactCurrency(stats.volume) : "N/A"}
            </span>
            {splitTotal > 0 ? (
              <>
                <div className="hero-volume-bar" aria-hidden="true">
                  <i style={{ width: `${(split.buy / splitTotal) * 100}%` }} className="is-buy" />
                  <i style={{ width: `${(split.sell / splitTotal) * 100}%` }} className="is-sell" />
                </div>
                <span className="hero-metric-sub">
                  <span className="tone-positive">{formatCompactCurrency(split.buy)} Buy</span>
                  {" · "}
                  <span className="tone-negative">{formatCompactCurrency(split.sell)} Sell</span>
                </span>
              </>
            ) : (
              <span className="hero-metric-sub">All-time notional</span>
            )}
          </div>

          <div className="hero-metric hero-metric-pnl">
            <div className="hero-pnl-copy">
              <span className="hero-metric-label">Total PnL</span>
              <span className={`hero-metric-value ${pnlTone}`}>
                <AnimatedNumber
                  value={stats?.pnl}
                  format={(v) => (v != null ? formatSignedCurrency(v) : detailsLoading ? "…" : "N/A")}
                />
              </span>
              <span className="hero-metric-sub">
                {stats?.settledPnl != null && (
                  <>Settled {formatSignedCurrency(stats.settledPnl, { decimals: 0 })} · </>
                )}
                {stats?.unrealizedPnl != null ? (
                  <span className={getToneClass(stats.unrealizedPnl)}>
                    Open {formatSignedCurrency(stats.unrealizedPnl, { decimals: 0 })}
                  </span>
                ) : (
                  "Settled + open"
                )}
              </span>
            </div>
            <div className="hero-pnl-chart">
              <div className="hero-spark-ranges" role="group" aria-label="Sparkline range">
                {SPARK_RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`hero-spark-btn ${sparkRange === r ? "is-active" : ""}`}
                    onClick={() => setSparkRange(r)}
                  >
                    {r === "ALL" ? "All" : r}
                  </button>
                ))}
              </div>
              <PnlSparkline points={sparkPoints} tone={sparkTone} />
            </div>
          </div>
        </div>

        {onRefresh && (
          <button type="button" className="hero-refresh" onClick={onRefresh} aria-label="Refresh profile">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </section>
  );
}
