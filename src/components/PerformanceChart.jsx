import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency, formatSignedCurrency, formatPercentage, formatDateTime, formatCompactCurrency } from "../utils/formatters";
import { getValueState } from "../utils/states";

const WIDTH = 640;
const HEIGHT = 220;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const PAD_X = 4;
const USABLE_WIDTH = WIDTH - PAD_X * 2;
const USABLE_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;

// Morph resolution: both series are resampled to this many points so curves
// with different point counts can be interpolated against each other.
const MORPH_SAMPLES = 72;
const MORPH_MS = 420;

const PALETTE = {
  positive: { line: "#2FB57E", soft: "#34C98E" },
  negative: { line: "#E5484D", soft: "#E5484D" },
  neutral: { line: "#6E8BFF", soft: "#7C9CFF" },
};

const X_TICK_COUNT = 4;

// Faithful Catmull-Rom interpolation: the curve passes exactly through every
// real data point. Tension is kept modest so increases, decreases, plateaus,
// drawdowns and recoveries are preserved without inventing smoother shape
// between them. With the provider feeding real event-level points this stays
// crisp and never looks artificially polished.
function buildSmoothPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function sampleAt(pts, t) {
  if (pts.length === 0) return { y: 0, value: 0, date: null };
  if (pts.length === 1) return pts[0];
  const pos = t * (pts.length - 1);
  const i0 = Math.floor(pos);
  const i1 = Math.min(pts.length - 1, i0 + 1);
  const frac = pos - i0;
  return {
    y: pts[i0].y + (pts[i1].y - pts[i0].y) * frac,
    value: pts[i0].value + (pts[i1].value - pts[i0].value) * frac,
    date: pts[i1].date,
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * X-axis tick labels. The tick count is constant, but the label format adapts
 * to the selected range: intraday times for 1D, weekdays for 1W, calendar
 * dates for longer windows.
 */
function buildXTicks(points) {
  if (!points || points.length < 2) return [];
  const start = new Date(points[0].date).getTime();
  const end = new Date(points[points.length - 1].date).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

  const ticks = [];
  for (let i = 0; i <= X_TICK_COUNT; i++) {
    const t = start + ((end - start) * i) / X_TICK_COUNT;
    ticks.push({ t, x: (i / X_TICK_COUNT) * 100, first: i === 0, last: i === X_TICK_COUNT });
  }
  return ticks;
}

function formatAxisTick(ms, range) {
  const d = new Date(ms);
  if (range === "1D") return d.toLocaleTimeString("en-US", { hour: "numeric" });
  if (range === "1W") return d.toLocaleDateString("en-US", { weekday: "short" });
  if (range === "1M" || range === "3M") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Analytics line chart. In performance mode (realized PnL) the line/area and
 * hover colors follow the net direction - positive green, negative red, zero
 * neutral. In volume mode it uses a restrained neutral accent: volume is not
 * a financial state, so it never borrows the positive/negative colors.
 * When the dataset changes (new range or metric) the previous curve morphs
 * smoothly into the new one instead of swapping instantly.
 */
export default function PerformanceChart({ data, metric = "performance", range = "1M", startValue = 0 }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [displayPoints, setDisplayPoints] = useState(null);
  const svgRef = useRef(null);
  const rafRef = useRef(null);
  const committedRef = useRef(null);

  const target = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], gridLines: [], tone: "neutral" };
    }
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const rangeWidth = max - min || max * 0.1 || 1;
    const paddedMin = min - rangeWidth * 0.12;
    const paddedMax = max + rangeWidth * 0.12;
    const paddedRange = paddedMax - paddedMin || 1;

    const pts = data.map((d, i) => ({
      x: PAD_X + (i / (data.length - 1 || 1)) * USABLE_WIDTH,
      y: PAD_TOP + USABLE_HEIGHT - ((d.value - paddedMin) / paddedRange) * USABLE_HEIGHT,
      value: d.value,
      date: d.date,
    }));

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      y: PAD_TOP + t * USABLE_HEIGHT,
      value: paddedMax - t * paddedRange,
    }));

    const change = data[data.length - 1].value - data[0].value;
    const state = metric === "performance" ? getValueState(change) : "neutral";

    return { points: pts, gridLines, tone: state };
  }, [data, metric]);

  useEffect(() => {
    const from = committedRef.current;
    const to = target.points;

    if (!from || from.length < 2 || to.length < 2) {
      setDisplayPoints(to);
      committedRef.current = to;
      return undefined;
    }

    cancelAnimationFrame(rafRef.current);
    setHoverIndex(null);

    const start = performance.now();
    const frame = (now) => {
      const progress = Math.min(1, (now - start) / MORPH_MS);
      const eased = easeInOutCubic(progress);
      const next = [];
      for (let i = 0; i < MORPH_SAMPLES; i++) {
        const t = i / (MORPH_SAMPLES - 1);
        const a = sampleAt(from, t);
        const b = sampleAt(to, t);
        next.push({
          x: PAD_X + t * USABLE_WIDTH,
          y: a.y + (b.y - a.y) * eased,
          value: a.value + (b.value - a.value) * eased,
          date: b.date,
        });
      }
      setDisplayPoints(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        committedRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(rafRef.current);
  }, [target.points]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const points = displayPoints ?? target.points;
  const { gridLines, tone } = target;
  const metricLabel = metric === "performance" ? "Realized PnL" : "Trading Volume";

  const linePath = useMemo(() => buildSmoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x} ${HEIGHT - PAD_BOTTOM} L ${first.x} ${HEIGHT - PAD_BOTTOM} Z`;
  }, [linePath, points]);

  const palette = PALETTE[tone] || PALETTE.neutral;
  const gradientId = "performance-line-gradient";
  const areaGradientId = "performance-area-gradient";

  function handlePointerMove(e) {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    if (clientX === undefined) return;
    const relX = ((clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        {metric === "performance" ? "No resolved positions in this period" : "No trading activity in this period"}
      </div>
    );
  }

  const activePoint = hoverIndex !== null && points.length > 0 ? points[hoverIndex] : null;
  const hoverChange = activePoint ? activePoint.value - (startValue ?? 0) : 0;
  const hoverChangePct = startValue && startValue !== 0 ? hoverChange / Math.abs(startValue) : null;
  const hoverTone = metric === "performance" ? getValueState(hoverChange) : "neutral";

  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        className="chart-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label={metric === "performance" ? "Realized PnL chart" : "Cumulative trading volume chart"}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={palette.line} />
            <stop offset="1" stopColor={palette.soft} />
          </linearGradient>
          <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={palette.soft} stopOpacity="0.2" />
            <stop offset="1" stopColor={palette.soft} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((line, i) => (
          <line key={i} x1={0} y1={line.y} x2={WIDTH} y2={line.y} className="chart-grid-line" />
        ))}

        <path d={areaPath} fill={`url(#${areaGradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" />

        {activePoint && (
          <>
            <line
              x1={activePoint.x}
              y1={PAD_TOP}
              x2={activePoint.x}
              y2={HEIGHT - PAD_BOTTOM}
              className="chart-crosshair"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="4" className={`chart-dot tone-${hoverTone}`} />
          </>
        )}
      </svg>

      <div className="chart-ylabels" aria-hidden="true">
        {gridLines.map((line, i) => (
          <span key={i} className="chart-ylabel" style={{ top: `${(line.y / HEIGHT) * 100}%` }}>
            {formatCompactCurrency(line.value)}
          </span>
        ))}
      </div>

      {activePoint && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(activePoint.x / WIDTH) * 100}%`,
            top: `${(activePoint.y / HEIGHT) * 100}%`,
          }}
        >
          <div className="chart-tooltip-date">{formatDateTime(activePoint.date)}</div>
          <div className="chart-tooltip-metric">{metricLabel}</div>
          <div className="chart-tooltip-value">
            {metric === "performance" ? formatSignedCurrency(activePoint.value) : formatCurrency(activePoint.value)}
          </div>
          <div className={`chart-tooltip-pnl ${metric === "performance" ? `tone-${hoverTone}` : "tone-neutral"}`}>
            {metric === "performance" ? `Range PnL ${formatSignedCurrency(hoverChange)}` : `In range ${formatCurrency(hoverChange)}`}
            {metric === "performance" && hoverChangePct != null ? ` (${formatPercentage(hoverChangePct, { signed: true })})` : ""}
          </div>
        </div>
      )}

      <div className="chart-axis" aria-hidden="true">
        {buildXTicks(points).map((tick, i) => (
          <span
            key={i}
            className={`chart-axis-tick ${tick.first ? "is-first" : ""} ${tick.last ? "is-last" : ""}`}
            style={{ left: `${tick.x}%` }}
          >
            {formatAxisTick(tick.t, range)}
          </span>
        ))}
      </div>
    </div>
  );
}