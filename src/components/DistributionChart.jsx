// Small horizontal bar visualization for account performance distribution.
// Bars are simple divs - no chart library needed - and share the quiet
// visual language of the rest of the app.

export default function DistributionChart({ buckets }) {
  if (!buckets || buckets.length === 0) return null;

  return (
    <div className="distribution-chart">
      {buckets.map((bucket) => (
        <div className="distribution-row" key={bucket.label}>
          <span className="distribution-label">{bucket.label}</span>
          <div className="distribution-track" aria-hidden="true">
            <div className="distribution-fill" style={{ width: `${Math.max(4, bucket.share * 100)}%` }} />
          </div>
          <span className="distribution-count">{bucket.count}</span>
        </div>
      ))}
    </div>
  );
}