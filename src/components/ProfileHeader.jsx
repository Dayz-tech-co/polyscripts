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
  const explorerUrl = `https://polygonscan.com/address/${account.address}`;

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
      <div className="profile-header-glow" aria-hidden="true" />
      <div className="container profile-header-inner">
        <div className="profile-identity">
          <Avatar account={account} size={68} radius={14} />
          <div className="profile-identity-text">
            <div className="profile-name-row">
              <h1 className="profile-name">{primary}</h1>
              {account.verified && (
                <Tooltip label="Verified profile">
                  <BadgeCheck size={16} className="verified-badge" aria-label="Verified profile" />
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
              <Tooltip label="View on explorer">
                <a
                  className="icon-btn icon-btn-sm"
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open profile on block explorer"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </Tooltip>
            </div>

            {account.bio && <p className="profile-description">{account.bio}</p>}
            {account.tierName && <p className="profile-description-secondary">{account.tierName} tier trader</p>}
          </div>
        </div>

        <div className="profile-actions">
          <Tooltip label={copied ? "Copied" : "Copy address"}>
            <button type="button" className="btn btn-ghost btn-icon-only" onClick={handleCopy} aria-label="Copy wallet address">
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            </button>
          </Tooltip>
          <Tooltip label="Share profile">
            <button type="button" className="btn btn-ghost btn-icon-only" onClick={handleShare} aria-label="Share profile">
              <Share2 size={15} aria-hidden="true" />
            </button>
          </Tooltip>
          <a className="btn btn-secondary" href={explorerUrl} target="_blank" rel="noreferrer noopener">
            <ExternalLink size={14} aria-hidden="true" />
            <span>Explorer</span>
          </a>
        </div>
      </div>
    </section>
  );
}
