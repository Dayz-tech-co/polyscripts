import { useState } from "react";
import { Award, BadgeCheck, Check, Copy, ExternalLink, Gem, Shield, Share2, Zap } from "lucide-react";
import Avatar from "./Avatar";
import Tooltip from "./Tooltip";
import { ProfileHeaderSkeleton } from "./Skeleton";
import { shortenAddress } from "../utils/address";
import { useToast } from "../context/ToastContext";

const TIER_ICONS = {
  Diamond: Gem,
  Gold: Zap,
  Silver: Shield,
  Bronze: Award,
};

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
  const tierName = account.tierName;
  const TierIcon = tierName && TIER_ICONS[tierName] ? TIER_ICONS[tierName] : Award;

  // Clean bio of legacy "tier trader" text if present
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
        // user cancelled or share failed
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
          <Avatar account={account} size={44} radius={10} />
          <div className="profile-identity-text">
            <div className="profile-name-row">
              <h1 className="profile-name">{primary}</h1>
              {account.verified && (
                <Tooltip label="Verified profile">
                  <BadgeCheck size={14} className="verified-badge" aria-label="Verified profile" />
                </Tooltip>
              )}
              {tierName && (
                <Tooltip label={`${tierName} tier trader`}>
                  <span className={`tier-badge tier-${tierName.toLowerCase()}`}>
                    <TierIcon size={11} aria-hidden="true" />
                    <span>{tierName}</span>
                  </span>
                </Tooltip>
              )}
            </div>

            <div className="profile-address-row">
              <span className="address-pill">{secondary}</span>
              <Tooltip label={copied ? "Copied" : "Copy address"}>
                <button type="button" className="icon-btn icon-btn-sm" aria-label="Copy wallet address" onClick={handleCopy}>
                  {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                </button>
              </Tooltip>
              <Tooltip label="Share profile">
                <button type="button" className="icon-btn icon-btn-sm" aria-label="Share profile" onClick={handleShare}>
                  <Share2 size={13} aria-hidden="true" />
                </button>
              </Tooltip>
              <Tooltip label="Open on Polymarket">
                <a
                  className="icon-btn icon-btn-sm"
                  href={profileUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open public Polymarket profile"
                >
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              </Tooltip>
            </div>

            {cleanBio && (
              <p className="profile-description-secondary">
                {cleanBio}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}