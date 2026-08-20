export function Skeleton({ width, height = 14, radius = 6, style, className = "" }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="profile-header-inner">
      <div className="profile-identity">
        <Skeleton width={68} height={68} radius={14} />
        <div className="profile-identity-text">
          <Skeleton width={160} height={20} style={{ marginBottom: 8 }} />
          <Skeleton width={220} height={14} style={{ marginBottom: 10 }} />
          <Skeleton width={280} height={13} />
        </div>
      </div>
      <div className="profile-actions">
        <Skeleton width={34} height={34} radius={9} />
        <Skeleton width={34} height={34} radius={9} />
        <Skeleton width={34} height={34} radius={9} />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <section className="account-kpi account-kpi-skeleton" aria-hidden="true">
      <div className="account-kpi-hero">
        <Skeleton width={140} height={12} style={{ marginBottom: 14 }} />
        <Skeleton width={220} height={36} style={{ marginBottom: 10 }} />
        <Skeleton width={180} height={12} />
      </div>
      <div className="account-kpi-featured">
        <div className="account-kpi-card account-kpi-card-feature">
          <Skeleton width={100} height={12} style={{ marginBottom: 10 }} />
          <Skeleton width={140} height={24} />
        </div>
        <div className="account-kpi-card account-kpi-card-feature">
          <Skeleton width={100} height={12} style={{ marginBottom: 10 }} />
          <Skeleton width={140} height={24} />
        </div>
      </div>
      <div className="account-kpi-secondary">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="account-kpi-chip" key={i}>
            <Skeleton width={80} height={10} style={{ marginBottom: 8 }} />
            <Skeleton width={64} height={18} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ChartSkeleton() {
  return (
    <div className="chart-skeleton">
      <Skeleton width="100%" height={220} radius={10} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="table-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="table-skeleton-row" key={i}>
          <Skeleton width={28} height={28} radius={8} />
          <Skeleton width="40%" height={13} />
          <Skeleton width={60} height={13} />
          <Skeleton width={60} height={13} />
        </div>
      ))}
    </div>
  );
}
