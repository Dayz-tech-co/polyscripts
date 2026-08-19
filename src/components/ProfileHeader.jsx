import { useState } from "react";
import { BadgeCheck, Check, Copy, ExternalLink, Share2 } from "lucide-react";
import Avatar from "./Avatar";
import Tooltip from "./Tooltip";
import { ProfileHeaderSkeleton } from "./Skeleton";
import { shortenAddress } from "../utils/address";
import { useToast } from "../context/ToastContext";

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
        // user cancelled or share failed, fall through to clipboard copy
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
          <Avatar account={account} size={56} radius={12} />
          <div className="profile-identity-text">
            <div className="profile-name-row">
              <h1 className="profile-name">{primary}</h1>
              {account.verified && (
                <Tooltip label="Verified profile">
                  <BadgeCheck size={15} className="verified-badge" aria-label="Verified profile" />
                </Tooltip>
              )}
            </div>

            <div className="profile-address-row">
              <span className="address-pill">{secondary}</span>
              <Tooltip label={copied ? "Copied" : "Copy address"}>
                <button type="button" className="icon-btn icon-btn-sm" aria-label="Copy wallet address" onClick={handleCopy}>
                  {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                </button>
              </Tooltip>
              <Tooltip label="Share profile">
                <button type="button" className="icon-btn icon-btn-sm" aria-label="Share profile" onClick={handleShare}>
                  <Share2 size={14} aria-hidden="true" />
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
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </Tooltip>
            </div>

            {(account.bio || account.tierName) && (
              <p className="profile-description-secondary">
                {account.bio}
                {account.bio && account.tierName ? " · " : ""}
                {account.tierName ? `${account.tierName} tier trader` : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}