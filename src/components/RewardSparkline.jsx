export default function RewardSparkline({ values = [], color = "#2fb57e" }) {
  const safe = values.length > 1 ? values : [0, 0, 0, 0, 0, 0];
  const max = Math.max(1, ...safe);
  const points = safe.map((value, index) => `${(index / (safe.length - 1)) * 100},${34 - (value / max) * 26}`).join(" ");
  return (
    <svg className="reward-sparkline" viewBox="0 0 100 38" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
