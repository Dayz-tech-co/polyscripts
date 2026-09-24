import { useMemo, useState } from "react";
import { formatDateTime, formatPrice } from "../utils/formatters";

const W = 800;
const H = 260;
const PAD = { top: 16, right: 48, bottom: 28, left: 8 };

/** Outcome probability over time, with a hover crosshair. Points: [{ t, p }]. */
export default function MarketPriceChart({ points, label = "Yes" }) {
  const [hover, setHover] = useState(null);

  const geo = useMemo(() => {
    if (!points || points.length < 2) return null;
    const t0 = points[0].t;
    const t1 = points[points.length - 1].t;
    let lo = Math.min(...points.map((p) => p.p));
    let hi = Math.max(...points.map((p) => p.p));
    const pad = Math.max(0.02, (hi - lo) * 0.15);
    lo = Math.max(0, lo - pad);
    hi = Math.min(1, hi + pad);
    const x = (t) => PAD.left + ((t - t0) / Math.max(1, t1 - t0)) * (W - PAD.left - PAD.right);
    const y = (p) => PAD.top + (1 - (p - lo) / Math.max(0.0001, hi - lo)) * (H - PAD.top - PAD.bottom);
    const xy = points.map((p) => ({ ...p, x: x(p.t), y: y(p.p) }));
    const line = xy.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const area = `${line} L${xy[xy.length - 1].x.toFixed(1)} ${H - PAD.bottom} L${xy[0].x.toFixed(1)} ${H - PAD.bottom} Z`;
    const ticks = [0, 0.5, 1].map((f) => ({ v: lo + (hi - lo) * f, y: y(lo + (hi - lo) * f) }));
    const rising = points[points.length - 1].p >= points[0].p;
    return { xy, line, area, ticks, rising };
  }, [points]);

  if (!geo) return <div className="market-chart-empty">No price history for this range.</div>;

  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    let best = geo.xy[0];
    for (const p of geo.xy) if (Math.abs(p.x - px) < Math.abs(best.x - px)) best = p;
    setHover(best);
  }

  const stroke = geo.rising ? "var(--positive)" : "var(--negative)";
  return (
    <div className="market-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} price history`} onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="mkt-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {geo.ticks.map((tick) => (
          <g key={tick.v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={tick.y} y2={tick.y} className="market-chart-grid" />
            <text x={W - PAD.right + 8} y={tick.y + 4} className="market-chart-tick">{formatPrice(tick.v)}</text>
          </g>
        ))}
        <path d={geo.area} fill="url(#mkt-area)" className="chart-area-in" key={`a-${geo.line.length}`} />
        <path d={geo.line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" pathLength="1" className="chart-draw" key={`l-${geo.line.length}`} />
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={PAD.top} y2={H - PAD.bottom} className="market-chart-cross" />
            <circle cx={hover.x} cy={hover.y} r="4" fill={stroke} />
          </g>
        )}
      </svg>
      <div className="market-chart-readout" aria-live="polite">
        {hover ? (
          <>
            <strong>{label} {formatPrice(hover.p)}</strong>
            <span>{formatDateTime(hover.t)}</span>
          </>
        ) : (
          <span>Hover the chart for exact prices</span>
        )}
      </div>
    </div>
  );
}
