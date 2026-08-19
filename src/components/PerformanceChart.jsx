import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency, formatSignedCurrency, formatPercentage, formatDate, formatDateShort } from "../utils/formatters";
import { getValueState } from "../utils/states";

const WIDTH = 640;
const HEIGHT = 220;
const PAD_TOP = 14;
const PAD_BOTTOM = 24;
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
 * Analytics line chart. In PnL mode the line/area follows the net change
 * (positive green, negative red, zero neutral). In volume mode it uses a
 * restrained neutral accent - volume is not a financial state, so it never
 * borrows the positive/negative colors. When the dataset changes (e.g. a
 * new timeframe is selected) the previous curve morphs smoothly into the
 * new one instead of swapping instantly.
 */
export default function PerformanceChart({ data, volumeMode = false }) {
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
    const range = max - min || max * 0.1 || 1;
    const paddedMin = min - range * 0.12;
    const paddedMax = max + range * 0.12;
    const paddedRange = paddedMax - paddedMin || 1;

    const pts = data.map((d, i) => ({
      x: PAD_X + (i / (data.length - 1 || 1)) * USABLE_WIDTH,
      y: PAD_TOP + USABLE_HEIGHT - ((d.value - paddedMin) / paddedRange) * USABLE_HEIGHT,
      value: d.value,
      date: d.date,
    }));

    const lines = [0, 0.25, 0.5, 0.75, 1].map((t) => PAD_TOP + t * USABLE_HEIGHT);

    const change = data[data.length - 1].value - data[0].value;
    const state = volumeMode ? "neutral" : getValueState(change);

    return { points: pts, gridLines: lines, tone: state };
  }, [data, volumeMode]);

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
    return <div className="chart-empty">No trading activity in this period</div>;
  }

  const activePoint = hoverIndex !== null && points.length > 0 ? points[hoverIndex] : null;
  const firstValue = points[0]?.value ?? 0;
  const hoverChange = activePoint ? activePoint.value - firstValue : 0;
  const hoverChangePct = firstValue !== 0 ? hoverChange / firstValue : null;
  const hoverTone = volumeMode ? "neutral" : getValueState(hoverChange);

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
        aria-label={volumeMode ? "Cumulative trading volume chart" : "Performance chart"}
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

        {gridLines.map((y, i) => (
          <line key={i} x1={0} y1={y} x2={WIDTH} y2={y} className="chart-grid-line" />
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

      {activePoint && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(activePoint.x / WIDTH) * 100}%`,
            top: `${(activePoint.y / HEIGHT) * 100}%`,
          }}
        >
          <div className="chart-tooltip-date">{formatDate(activePoint.date)}</div>
          <div className="chart-tooltip-value">{formatCurrency(activePoint.value)}</div>
          <div className={`chart-tooltip-pnl ${volumeMode ? "tone-neutral" : `tone-${hoverTone}`}`}>
            {formatSignedCurrency(hoverChange)}
            {hoverChangePct != null ? ` (${formatPercentage(hoverChangePct, { signed: true })})` : ""}
          </div>
        </div>
      )}

      <div className="chart-axis" aria-hidden="true">
        <span>{formatDateShort(points[0].date)}</span>
        <span>{formatDateShort(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}