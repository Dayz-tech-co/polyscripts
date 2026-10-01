/** Compact PnL sparkline for the profile hero strip. */
export default function PnlSparkline({ points = [], tone = "neutral", className = "" }) {
  const values = (points || [])
    .map((p) => (typeof p === "number" ? p : p?.value))
    .filter((v) => Number.isFinite(v));

  if (values.length < 2) {
    return (
      <svg className={`pnl-sparkline ${className}`} viewBox="0 0 160 48" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="24" x2="160" y2="24" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) * 0.08 || 1;
  const pad = 4;
  const w = 160;
  const h = 48;
  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return [x, y];
  });

  let d = `M ${coords[0][0].toFixed(2)} ${coords[0][1].toFixed(2)}`;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx.toFixed(2)} ${y0.toFixed(2)}, ${cx.toFixed(2)} ${y1.toFixed(2)}, ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }

  const last = coords[coords.length - 1];
  const area = `${d} L ${last[0].toFixed(2)} ${h} L 0 ${h} Z`;
  const stroke =
    tone === "positive" ? "#2fb57e" : tone === "negative" ? "#e5484d" : "#7c9cff";
  const fillId = `spark-fill-${tone}`;

  return (
    <svg className={`pnl-sparkline ${className}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
