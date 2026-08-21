import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Award, BadgeCheck, Bookmark, BookmarkCheck, Check, Copy, Crown, Gem, Hexagon, Shield, Share2, Zap } from "lucide-react";
import Avatar from "./Avatar";
import Tooltip from "./Tooltip";
import PolymarketIcon from "./PolymarketIcon";
import { ProfileHeaderSkeleton } from "./Skeleton";
import { shortenAddress } from "../utils/address";
import { useToast } from "../context/toast";
import { isAccountWatched, subscribeToWatchlist, toggleWatchlistAccount } from "../utils/watchlist";

const TIER_ICONS = {
  "Tier 0": Award,
  Bronze: Award,
  Silver: Shield,
  Gold: Zap,
  Platinum: Crown,
  Diamond: Gem,
  Obsidian: Hexagon,
};

function tierCssSlug(tierName, tier) {
  if (tier != null && Number.isFinite(tier)) return String(tier);
  if (!tierName) return "0";
  return String(tierName).toLowerCase().replace(/\s+/g, "-");
}

export default function ProfileHeader({ account, loading }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [watched, setWatched] = useState(() => isAccountWatched(account?.address));

  useEffect(() => {
    setWatched(isAccountWatched(account?.address));
    return subscribeToWatchlist(() => setWatched(isAccountWatched(account?.address)));
  }, [account?.address]);

  if (loading || !account) {
    return (
      <section className="profile-header" aria-label="Profile">
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

  const cleanBio = account.bio ? account.bio.replace(/([A-Z][a-z]+)\s+tier\s+trader\.?/i, "").trim() : "";

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
    showToast(next ? "Added to watchlist. Find it on Dashboard." : "Removed from watchlist");
  }

  return (
    <section className="profile-header" aria-label="Profile">
      <div className="container profile-header-inner">
        <div className="profile-identity">
          <Avatar account={account} size={44} />
          <div className="profile-identity-text">
            <div className="profile-name-row">
              <h1 className="profile-name">
                <a href={profileUrl} target="_blank" rel="noreferrer noopener" title="Open on Polymarket">
                  {primary}
                </a>
              </h1>
              {account.verified && (
                <Tooltip label="Verified profile" position="bottom">
                  <span className="profile-badge-hit" tabIndex={0} aria-label="Verified profile">
                    <BadgeCheck size={14} className="verified-badge" aria-hidden="true" />
                  </span>
                </Tooltip>
              )}
              {tierLabel && (
                <Tooltip label={`Polymarket taker tier · ${tierLabel}`} position="bottom">
                  <span className={`tier-badge tier-${tierSlug} profile-badge-hit`} tabIndex={0}>
                    <TierIcon size={11} aria-hidden="true" />
                    <span>{tierLabel}</span>
                  </span>
                </Tooltip>
              )}
            </div>

            <div className="profile-address-row">
              <span className="address-pill">{secondary}</span>
              <Tooltip label={copied ? "Copied" : "Copy address"} position="bottom">
                <button type="button" className="icon-btn icon-btn-sm" aria-label="Copy wallet address" onClick={handleCopy}>
                  {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                </button>
              </Tooltip>
              <Tooltip label="Share profile" position="bottom">
                <button type="button" className="icon-btn icon-btn-sm" aria-label="Share profile" onClick={handleShare}>
                  <Share2 size={13} aria-hidden="true" />
                </button>
              </Tooltip>
            </div>

            {cleanBio && <p className="profile-description-secondary">{cleanBio}</p>}
          </div>
        </div>
        <div className="profile-header-actions">
          <button
            type="button"
            className={`watchlist-toggle ${watched ? "is-active" : ""}`}
            aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
            aria-pressed={watched}
            onClick={handleWatchlist}
          >
            {watched ? <BookmarkCheck size={14} aria-hidden="true" /> : <Bookmark size={14} aria-hidden="true" />}
            <span>{watched ? "Watching" : "Watch"}</span>
          </button>
          {watched && <Link className="watchlist-view-link" to="/dashboard">View list</Link>}
          <a
            className="polymarket-profile-link"
            href={profileUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Open public Polymarket profile"
          >
            <PolymarketIcon size={16} />
            <span>Polymarket</span>
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
