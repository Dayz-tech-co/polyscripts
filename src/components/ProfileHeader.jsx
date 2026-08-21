import { useState } from "react";
import { Link } from "react-router-dom";
import { Award, BadgeCheck, Check, Copy, Crown, Gem, GitCompareArrows, Hexagon, Shield, Share2, Zap } from "lucide-react";
import Avatar from "./Avatar";
import Tooltip from "./Tooltip";
import PolymarketIcon from "./PolymarketIcon";
import { ProfileHeaderSkeleton } from "./Skeleton";
import { shortenAddress } from "../utils/address";
import { useToast } from "../context/ToastContext";

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

function XIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.263 5.688L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

export default function ProfileHeader({ account, loading }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

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
  const profileUrl = `https://polymarket.com/profile/${hasUsername ? account.username : account.address}`;
  const compareTo = encodeURIComponent(account.username || account.address);
  const xHandle = account.xUsername ? String(account.xUsername).replace(/^@/, "") : null;
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

  return (
    <section className="profile-header" aria-label="Profile">
      <div className="container profile-header-inner">
        <div className="profile-identity">
          <Avatar account={account} size={44} radius={0} />
          <div className="profile-identity-text">
            <div className="profile-name-row">
              <h1 className="profile-name">{primary}</h1>
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
              <Tooltip label="Compare this account" position="bottom">
                <Link
                  className="icon-btn icon-btn-sm"
                  to={`/compare?a=${compareTo}`}
                  aria-label="Compare this account"
                >
                  <GitCompareArrows size={13} aria-hidden="true" />
                </Link>
              </Tooltip>
              {xHandle && (
                <Tooltip label={`@${xHandle} on X`} position="bottom">
                  <a
                    className="icon-btn icon-btn-sm"
                    href={`https://x.com/${encodeURIComponent(xHandle)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`Open @${xHandle} on X`}
                  >
                    <XIcon size={13} />
                  </a>
                </Tooltip>
              )}
              <Tooltip label="Open on Polymarket" position="bottom">
                <a
                  className="icon-btn icon-btn-sm polymarket-link-btn"
                  href={profileUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open public Polymarket profile"
                >
                  <PolymarketIcon size={16} />
                </a>
              </Tooltip>
            </div>

            {cleanBio && <p className="profile-description-secondary">{cleanBio}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
