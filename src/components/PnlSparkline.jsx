import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatCompactCurrency, formatDateTime } from "../utils/formatters";

const SIZES = {
  board: { w: 960, h: 220, pad: { top: 18, right: 18, bottom: 28, left: 12 } },
  compact: { w: 420, h: 148, pad: { top: 14, right: 14, bottom: 22, left: 8 } },
};

const COLORS = {
  positive: "#3DDC97",
  negative: "#FF5C69",
  neutral: "#8BA4FF",
};

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

function downsample(points, max = 160) {
  if (!points || points.length <= max) return points || [];
  const step = (points.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

/**
 * Full-bleed hero PnL chart — monotone curve, guides, hover, live end marker.
 */
export default function PnlSparkline({
  points = [],
  tone = "neutral",
  className = "",
  variant = "compact",
}) {
  const uid = useId().replace(/:/g, "");
  const lineRef = useRef(null);
  const areaRef = useRef(null);
  const [hover, setHover] = useState(null);
  const size = SIZES[variant] || SIZES.compact;
  const { w: W, h: H, pad: PAD } = size;
  const PLOT_W = W - PAD.left - PAD.right;
  const PLOT_H = H - PAD.top - PAD.bottom;

  const series = useMemo(() => {
    const raw = (points || [])
      .map((p) => ({
        date: p?.date ?? null,
        value: typeof p === "number" ? p : p?.value,
      }))
      .filter((p) => Number.isFinite(p.value));
    return downsample(raw, variant === "board" ? 180 : 120);
  }, [points, variant]);

  const mapped = useMemo(() => {
    if (series.length < 2) return [];
    const values = series.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const floor = Math.max(Math.abs(max - min) * 0.08, Math.abs(max) * 0.05, Math.abs(min) * 0.05, 1);
    const spread = Math.max(max - min, floor);
    const yMin = min - spread * 0.16;
    const yMax = max + spread * 0.16;
    const yRange = yMax - yMin || 1;

    return series.map((p, i) => {
      const x = PAD.left + (i / (series.length - 1)) * PLOT_W;
      const y = PAD.top + PLOT_H - ((p.value - yMin) / yRange) * PLOT_H;
      return { ...p, x, y, i, yMin, yMax };
    });
  }, [series, PAD.left, PAD.top, PLOT_W, PLOT_H]);

  const stroke = COLORS[tone] || COLORS.neutral;
  const linePath = useMemo(() => buildMonotonePath(mapped), [mapped]);
  const areaPath = useMemo(() => {
    if (mapped.length < 2) return "";
    const first = mapped[0];
    const last = mapped[mapped.length - 1];
    const base = PAD.top + PLOT_H;
    return `${linePath} L ${last.x.toFixed(2)} ${base} L ${first.x.toFixed(2)} ${base} Z`;
  }, [linePath, mapped, PAD.top, PLOT_H]);

  const last = mapped[mapped.length - 1] || null;
  const first = mapped[0] || null;
  const delta = last && first ? last.value - first.value : 0;

  const zeroY = useMemo(() => {
    if (!mapped.length) return null;
    const { yMin, yMax } = mapped[0];
    if (yMin > 0 || yMax < 0) return null;
    const yRange = yMax - yMin || 1;
    return PAD.top + PLOT_H - ((0 - yMin) / yRange) * PLOT_H;
  }, [mapped, PAD.top, PLOT_H]);

  const xTicks = useMemo(() => {
    if (mapped.length < 2) return [];
    const count = variant === "board" ? 5 : 3;
    const out = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.round((i / (count - 1)) * (mapped.length - 1));
      out.push(mapped[idx]);
    }
    return out;
  }, [mapped, variant]);

  const yTicks = useMemo(() => {
    if (!mapped.length) return [];
    const { yMin, yMax } = mapped[0];
    return [0.15, 0.5, 0.85].map((f) => {
      const value = yMin + (yMax - yMin) * (1 - f);
      const y = PAD.top + PLOT_H * f;
      return { value, y };
    });
  }, [mapped, PAD.top, PLOT_H]);

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
        line.style.transition = "stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)";
        line.style.strokeDashoffset = "0";
        if (area) {
          area.style.transition = "opacity 700ms 80ms cubic-bezier(0.16, 1, 0.3, 1)";
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
      <div className={`pnl-sparkline-shell is-empty variant-${variant} ${className}`}>
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
    <div className={`pnl-sparkline-shell tone-${tone} variant-${variant} ${className}`}>
      <div className="pnl-spark-meta" aria-hidden="true">
        <span className={`pnl-spark-delta ${delta >= 0 ? "is-up" : "is-down"}`}>
          {delta >= 0 ? "+" : "−"}
          {formatCompactCurrency(Math.abs(delta))}
          <em> in view</em>
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
            <stop offset="0%" stopColor={stroke} stopOpacity="0.38" />
            <stop offset="45%" stopColor={stroke} stopOpacity="0.1" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={tick.y} x2={W - PAD.right} y2={tick.y} className="pnl-spark-grid" />
            {variant === "board" && (
              <text x={W - PAD.right} y={tick.y - 4} textAnchor="end" className="pnl-spark-ylabel">
                {formatCompactCurrency(tick.value)}
              </text>
            )}
          </g>
        ))}

        {zeroY != null && (
          <line
            x1={PAD.left}
            y1={zeroY}
            x2={W - PAD.right}
            y2={zeroY}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            strokeDasharray="4 5"
          />
        )}

        <path ref={areaRef} d={areaPath} fill={`url(#${fillId})`} className="pnl-spark-area" />
        <path
          ref={lineRef}
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth={variant === "board" ? 2.8 : 2.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
          className="pnl-spark-line"
        />

        {last && !hover && (
          <g className="pnl-spark-end" transform={`translate(${last.x}, ${last.y})`}>
            <circle r="10" fill={stroke} opacity="0.18" className="pnl-spark-pulse" />
            <circle r="4" fill={stroke} stroke="rgba(6,10,16,0.95)" strokeWidth="2" />
          </g>
        )}

        {hover && (
          <g className="pnl-spark-hover">
            <line
              x1={hover.x}
              y1={PAD.top}
              x2={hover.x}
              y2={PAD.top + PLOT_H}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <circle cx={hover.x} cy={hover.y} r="5" fill={stroke} stroke="rgba(6,10,16,0.95)" strokeWidth="2" />
            <g
              transform={`translate(${Math.min(W - 96, Math.max(PAD.left, hover.x - 44))}, ${Math.max(6, hover.y - 32)})`}
            >
              <rect width="88" height="22" rx="7" fill="rgba(8,12,18,0.94)" stroke="rgba(255,255,255,0.1)" />
              <text x="44" y="15" textAnchor="middle" className="pnl-spark-tip">
                {formatCompactCurrency(hover.value)}
              </text>
            </g>
          </g>
        )}

        {xTicks.map((tick, i) => (
          <text
            key={i}
            x={tick.x}
            y={H - 8}
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
