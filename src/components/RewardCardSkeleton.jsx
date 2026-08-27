export default function RewardCardSkeleton({ label = "Loading verified reward activity" }) {
  return (
    <section className="reward-card-skeleton" aria-busy="true" aria-label={label}>
      <div className="reward-skeleton-head"><i /><div><b /><span /></div><em /></div>
      <div className="reward-skeleton-value"><strong /><span /></div>
      <div className="reward-skeleton-stats"><i /><i /><i /></div>
      <p><span className="reward-skeleton-pulse" />{label}</p>
    </section>
  );
}
