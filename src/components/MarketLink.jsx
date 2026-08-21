import { ExternalLink } from "lucide-react";

export default function MarketLink({ position, iconOnly = false }) {
  if (!position?.slug) return null;
  const href = `https://polymarket.com/event/${encodeURIComponent(position.slug)}`;

  return (
    <a
      className={iconOnly ? "icon-btn icon-btn-sm" : "position-market-link"}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`Open ${position.market} on Polymarket`}
      onClick={(event) => event.stopPropagation()}
    >
      <ExternalLink size={13} aria-hidden="true" />
      {!iconOnly && <span>Open market</span>}
    </a>
  );
}
