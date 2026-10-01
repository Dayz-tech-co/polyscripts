import LogoMark from "./Logo";

/**
 * Soft spring loader with the real PolyScripts mark.
 */
export default function PageLoader({
  label = "Loading",
  detail = "Fetching live Polymarket data",
  compact = false,
}) {
  return (
    <div className={`page-loader ${compact ? "is-compact" : ""}`} role="status" aria-live="polite">
      <div className="page-loader-orb" aria-hidden="true">
        <span className="page-loader-ring" />
        <span className="page-loader-ring is-delay" />
        <span className="page-loader-mark">
          <LogoMark size={compact ? 22 : 28} />
        </span>
      </div>
      <div className="page-loader-copy">
        <strong>{label}</strong>
        {detail ? <span>{detail}</span> : null}
      </div>
    </div>
  );
}

export function PanelSkeleton({ rows = 6, className = "" }) {
  return (
    <div className={`panel-skeleton ${className}`} aria-hidden="true">
      <div className="panel-skeleton-head">
        <span className="skeleton" style={{ width: 72, height: 72, borderRadius: "50%" }} />
        <div className="panel-skeleton-head-copy">
          <span className="skeleton" style={{ width: 90, height: 12 }} />
          <span className="skeleton" style={{ width: "100%", height: 10, marginTop: 10 }} />
          <span className="skeleton" style={{ width: "70%", height: 10, marginTop: 8 }} />
        </div>
      </div>
      <div className="panel-skeleton-grid">
        {Array.from({ length: rows }).map((_, i) => (
          <div className="panel-skeleton-row" key={i}>
            <span className="skeleton" style={{ width: `${40 + (i % 3) * 10}%`, height: 11 }} />
            <span className="skeleton" style={{ width: 64, height: 13 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
