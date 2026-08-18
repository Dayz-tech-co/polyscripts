import { useState } from "react";
import { BadgeCheck, Check, Copy, ExternalLink, Share2 } from "lucide-react";
import LogoMark from "./Logo";
import Tooltip from "./Tooltip";
import { ProfileHeaderSkeleton } from "./Skeleton";
import { shortenAddress } from "../utils/formatters";
import { useToast } from "../context/ToastContext";

export default function ProfileHeader({ profile, loading }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (loading || !profile) {
    return (
      <section className="profile-header" aria-label="Profile">
        <div className="container">
          <ProfileHeaderSkeleton />
        </div>
      </section>
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(profile.wallet);
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
        await navigator.share({ title: "PolyScripts", url });
        return;
      } catch {
        // user cancelled or share failed, fall through to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch {
      showToast("Unable to copy link");
    }
  }

  return (
    <section className="profile-header" aria-label="Profile">
      <div className="profile-header-glow" aria-hidden="true" />
      <div className="container profile-header-inner">
        <div className="profile-identity">
          <div className="profile-avatar">
            <LogoMark size={34} />
          </div>
          <div className="profile-identity-text">
            <div className="profile-name-row">
              <h1 className="profile-name">{profile.name}</h1>
              {profile.verified && (
                <Tooltip label="Verified profile">
                  <BadgeCheck size={16} className="verified-badge" aria-label="Verified profile" />
                </Tooltip>
              )}
            </div>

            <div className="profile-address-row">
              <span className="address-pill">{shortenAddress(profile.wallet)}</span>
              <Tooltip label={copied ? "Copied" : "Copy address"}>
                <button type="button" className="icon-btn icon-btn-sm" aria-label="Copy wallet address" onClick={handleCopy}>
                  {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                </button>
              </Tooltip>
              <Tooltip label="View on explorer">
                <a
                  className="icon-btn icon-btn-sm"
                  href={profile.explorerUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open profile on block explorer"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </Tooltip>
            </div>

            <p className="profile-description">{profile.description}</p>
            <p className="profile-description-secondary">{profile.secondaryDescription}</p>
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
          <a
            className="btn btn-secondary"
            href={profile.explorerUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            <ExternalLink size={14} aria-hidden="true" />
            <span>Explorer</span>
          </a>
        </div>
      </div>
    </section>
  );
}
