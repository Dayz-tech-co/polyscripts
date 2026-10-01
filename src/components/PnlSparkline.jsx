import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatCompactCurrency, formatDateTime } from "../utils/formatters";

const W = 420;
const H = 148;
const PAD = { top: 14, right: 14, bottom: 22, left: 8 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const COLORS = {
  positive: "#2FB57E",
  negative: "#E5484D",
  neutral: "#7C9CFF",
};

/** Fritsch–Carlson monotone cubic path through mapped points. */
function buildMonotonePath(pts) {
  if (!pts.length) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

  const n = pts.length;
  const dx = new Array(n - 1);
  const dy = new Array(n - 1);
  const ms = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    dy[i] = pts[i + 1].y - pts[i].y;
    ms[i] = dx[i] !== 0 ? dy[i] / dx[i] : 0;
  }

  const t = new Array(n);
  t[0] = ms[0];
  for (let i = 1; i < n - 1; i++) {
    if (ms[i - 1] * ms[i] <= 0) t[i] = 0;
    else {
      const c = ms[i - 1] + ms[i];
      t[i] = (3 * c) / (c / ms[i - 1] + c / ms[i]);
    }
  }
  t[n - 1] = ms[n - 2];

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const cp1x = pts[i].x + dx[i] / 3;
    const cp1y = pts[i].y + t[i] * (dx[i] / 3);
    const cp2x = pts[i + 1].x - dx[i] / 3;
    const cp2y = pts[i + 1].y - t[i + 1] * (dx[i] / 3);
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${pts[i + 1].x.toFixed(2)} ${pts[i + 1].y.toFixed(2)}`;
  }
  return d;
}

function downsample(points, max = 120) {
  if (!points || points.length <= max) return points || [];
  const step = (points.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i++) {
    out.push(points[Math.round(i * step)]);
  }
  return out;
}

/**
 * Premium hero PnL chart — monotone curve, soft grid, hover readout, end pulse.
 */
export default function PnlSparkline({ points = [], tone = "neutral", className = "" }) {
  const uid = useId().replace(/:/g, "");
  const lineRef = useRef(null);
  const areaRef = useRef(null);
  const [hover, setHover] = useState(null);

  const series = useMemo(() => {
    const raw = (points || [])
      .map((p) => ({
        date: p?.date ?? null,
        value: typeof p === "number" ? p : p?.value,
      }))
      .filter((p) => Number.isFinite(p.value));
    return downsample(raw, 140);
  }, [points]);

  const mapped = useMemo(() => {
    if (series.length < 2) return [];
    const values = series.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const floor = Math.max(Math.abs(max) * 0.04, Math.abs(min) * 0.04, 1);
    const spread = Math.max(max - min, floor);
    const yMin = min - spread * 0.14;
    const yMax = max + spread * 0.14;
    const yRange = yMax - yMin || 1;

    return series.map((p, i) => {
      const x = PAD.left + (i / (series.length - 1)) * PLOT_W;
      const y = PAD.top + PLOT_H - ((p.value - yMin) / yRange) * PLOT_H;
      return { ...p, x, y, i };
    });
  }, [series]);

  const stroke = COLORS[tone] || COLORS.neutral;
  const linePath = useMemo(() => buildMonotonePath(mapped), [mapped]);
  const areaPath = useMemo(() => {
    if (mapped.length < 2) return "";
    const first = mapped[0];
    const last = mapped[mapped.length - 1];
    const base = PAD.top + PLOT_H;
    return `${linePath} L ${last.x.toFixed(2)} ${base} L ${first.x.toFixed(2)} ${base} Z`;
  }, [linePath, mapped]);

  const last = mapped[mapped.length - 1] || null;
  const first = mapped[0] || null;
  const delta = last && first ? last.value - first.value : 0;

  const xTicks = useMemo(() => {
    if (mapped.length < 2) return [];
    const idxs = [0, Math.floor((mapped.length - 1) / 2), mapped.length - 1];
    return idxs.map((i) => mapped[i]).filter(Boolean);
  }, [mapped]);

  // Draw-on reveal when series changes
  useEffect(() => {
    const line = lineRef.current;
    const area = areaRef.current;
    if (!line || !linePath) return undefined;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    line.style.transition = "none";
    line.style.strokeDasharray = "none";
    line.style.strokeDashoffset = "0";
    if (area) {
      area.style.transition = "none";
      area.style.opacity = "1";
    }
    if (reduce) return undefined;

    let f1 = 0;
    let f2 = 0;
    f1 = requestAnimationFrame(() => {
      const len = line.getTotalLength?.() ?? 0;
      if (len < 2) return;
      line.style.strokeDasharray = String(len);
      line.style.strokeDashoffset = String(len);
      if (area) area.style.opacity = "0";
      f2 = requestAnimationFrame(() => {
        line.style.transition = "stroke-dashoffset 780ms cubic-bezier(0.16, 1, 0.3, 1)";
        line.style.strokeDashoffset = "0";
        if (area) {
          area.style.transition = "opacity 600ms 100ms cubic-bezier(0.16, 1, 0.3, 1)";
          area.style.opacity = "1";
        }
      });
    });
    return () => {
      cancelAnimationFrame(f1);
      cancelAnimationFrame(f2);
    };
  }, [linePath]);

  function handleMove(e) {
    if (mapped.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(frac * (mapped.length - 1));
    setHover(mapped[idx] || null);
  }

  if (mapped.length < 2) {
    return (
      <div className={`pnl-sparkline-shell is-empty ${className}`}>
        <svg className="pnl-sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <line
            x1={PAD.left}
            y1={H / 2}
            x2={W - PAD.right}
            y2={H / 2}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
        </svg>
        <span className="pnl-spark-empty">Waiting for PnL history</span>
      </div>
    );
  }

  const active = hover || last;
  const fillId = `pnl-fill-${uid}`;
  const glowId = `pnl-glow-${uid}`;

  return (
    <div className={`pnl-sparkline-shell tone-${tone} ${className}`}>
      <div className="pnl-spark-meta" aria-hidden="true">
        <span className={`pnl-spark-delta ${delta >= 0 ? "is-up" : "is-down"}`}>
          {delta >= 0 ? "▲" : "▼"} {formatCompactCurrency(Math.abs(delta))}
        </span>
        {active?.date ? <span className="pnl-spark-when">{formatDateTime(active.date)}</span> : null}
      </div>

      <svg
        className="pnl-sparkline"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="PnL history chart"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.34" />
            <stop offset="55%" stopColor={stroke} stopOpacity="0.08" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft horizontal guides */}
        {[0.25, 0.5, 0.75].map((f) => {
          const y = PAD.top + PLOT_H * f;
          return (
            <line
              key={f}
              x1={PAD.left}
              y1={y}
              x2={W - PAD.right}
              y2={y}
              className="pnl-spark-grid"
            />
          );
        })}

        <path ref={areaRef} d={areaPath} fill={`url(#${fillId})`} className="pnl-spark-area" />
        <path
          ref={lineRef}
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
          className="pnl-spark-line"
        />

        {/* End marker */}
        {last && !hover && (
          <g className="pnl-spark-end" transform={`translate(${last.x}, ${last.y})`}>
            <circle r="8" fill={stroke} opacity="0.2" className="pnl-spark-pulse" />
            <circle r="3.5" fill={stroke} stroke="rgba(8,11,17,0.92)" strokeWidth="1.6" />
          </g>
        )}

        {/* Hover crosshair + tip */}
        {hover && (
          <g className="pnl-spark-hover">
            <line
              x1={hover.x}
              y1={PAD.top}
              x2={hover.x}
              y2={PAD.top + PLOT_H}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <circle cx={hover.x} cy={hover.y} r="4.5" fill={stroke} stroke="rgba(8,11,17,0.95)" strokeWidth="2" />
            <g transform={`translate(${Math.min(W - 88, Math.max(PAD.left, hover.x - 40))}, ${Math.max(4, hover.y - 28)})`}>
              <rect width="80" height="20" rx="6" fill="rgba(10,14,20,0.92)" stroke="rgba(255,255,255,0.08)" />
              <text x="40" y="13.5" textAnchor="middle" className="pnl-spark-tip">
                {formatCompactCurrency(hover.value)}
              </text>
            </g>
          </g>
        )}

        {/* X labels */}
        {xTicks.map((tick, i) => (
          <text
            key={i}
            x={tick.x}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
            className="pnl-spark-xlabel"
          >
            {tick.date
              ? new Date(tick.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : ""}
          </text>
        ))}
      </svg>
    </div>
  );
}
