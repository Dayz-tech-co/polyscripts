export default function StatCard({ icon: Icon, label, value, sub, subTone = "neutral" }) {
  return (
    <div className="stat-card">
      <div className="stat-card-head">
        <span className="stat-card-label">{label}</span>
        {Icon && <Icon size={15} className="stat-card-icon" aria-hidden="true" />}
      </div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className={`stat-card-sub tone-${subTone}`}>{sub}</div>}
    </div>
  );
}
