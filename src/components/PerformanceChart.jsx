import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency, formatSignedCurrency, formatPercentage, formatDateTime, formatCompactCurrency } from "../utils/formatters";
import { getValueState } from "../utils/states";

const WIDTH = 680;
const HEIGHT = 260;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PAD_LEFT = 4;
const PAD_RIGHT = 56; // Room for right-edge value tag
const USABLE_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;
const USABLE_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;

const PALETTE = {
  positive: { line: "#2FB57E", soft: "#34C98E", fillStop: "rgba(47, 181, 126, 0.15)" },
  negative: { line: "#E5484D", soft: "#E5484D", fillStop: "rgba(229, 72, 77, 0.15)" },
  neutral: { line: "#6E8BFF", soft: "#7C9CFF", fillStop: "rgba(110, 139, 255, 0.15)" },
};

const X_TICK_COUNT = 4;

/**
 * Fritsch-Carlson Monotone Cubic Spline SVG path generation.
 * Passes through every exact data point (x, y) without altering values or timestamps.
 * Guarantees zero overshoot beyond local extrema, producing a sleek, smooth financial curve.
 */
function buildMonotoneSmoothPath(points) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  const n = points.length;
  const dx = new Array(n - 1);
  const dy = new Array(n - 1);
  const ms = new Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x;
    dy[i] = points[i + 1].y - points[i].y;
    ms[i] = dx[i] !== 0 ? dy[i] / dx[i] : 0;
  }

  const mTangents = new Array(n);
  mTangents[0] = ms[0];
  for (let i = 1; i < n - 1; i++) {
    if (ms[i - 1] * ms[i] <= 0) {
      mTangents[i] = 0;
    } else {
      const common = ms[i - 1] + ms[i];
      mTangents[i] = (3 * common) / (common / ms[i - 1] + common / ms[i]);
    }
  }
  mTangents[n - 1] = ms[n - 2];

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const cp1x = points[i].x + dx[i] / 3;
    const cp1y = points[i].y + mTangents[i] * (dx[i] / 3);
    const cp2x = points[i + 1].x - dx[i] / 3;
    const cp2y = points[i + 1].y - mTangents[i + 1] * (dx[i] / 3);
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${points[i + 1].x.toFixed(2)} ${points[i + 1].y.toFixed(2)}`;
  }
  return path;
}

function buildXTicks(points) {
  if (!points || points.length < 2) return [];
  const start = new Date(points[0].date).getTime();
  const end = new Date(points[points.length - 1].date).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

  const ticks = [];
  for (let i = 0; i <= X_TICK_COUNT; i++) {
    const t = start + ((end - start) * i) / X_TICK_COUNT;
    const xPct = (PAD_LEFT / WIDTH + (i / X_TICK_COUNT) * (USABLE_WIDTH / WIDTH)) * 100;
    ticks.push({ t, x: xPct, first: i === 0, last: i === X_TICK_COUNT });
  }
  return ticks;
}

function formatAxisTick(ms, range, spanMs) {
  const d = new Date(ms);
  const isIntraday = (spanMs != null && spanMs > 0 && spanMs < 24 * 60 * 60 * 1000) || range === "1D";
  if (isIntraday) return d.toLocaleTimeString("en-US", { hour: "numeric" });
  if (range === "1W" && spanMs != null && spanMs <= 7 * 24 * 60 * 60 * 1000) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PerformanceChart({ data, metric = "performance", range = "1M", startValue = 0 }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [displayPoints, setDisplayPoints] = useState(null);
  const svgRef = useRef(null);

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

    const startMs = new Date(data[0].date).getTime();
    const endMs = new Date(data[data.length - 1].date).getTime();
    const spanMs = endMs - startMs || 1;

    const pts = data.map((d) => {
      const tMs = new Date(d.date).getTime();
      const frac = Number.isFinite(tMs) ? Math.max(0, Math.min(1, (tMs - startMs) / spanMs)) : 0;
      return {
        x: PAD_LEFT + frac * USABLE_WIDTH,
        y: PAD_TOP + USABLE_HEIGHT - ((d.value - paddedMin) / paddedRange) * USABLE_HEIGHT,
        value: d.value,
        date: d.date,
      };
    });

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      y: PAD_TOP + t * USABLE_HEIGHT,
      value: paddedMax - t * paddedRange,
    }));

    const change = data[data.length - 1].value - data[0].value;
    const state = metric === "performance" ? getValueState(change) : "neutral";

    return { points: pts, gridLines, tone: state };
  }, [data, metric]);

  useEffect(() => {
    setHoverIndex(null);
    setDisplayPoints(target.points);
  }, [target.points]);

  const points = displayPoints ?? target.points;
  const { gridLines, tone } = target;
  const metricLabel = metric === "performance" ? "Realized PnL" : "Trading Volume";

  const linePath = useMemo(() => buildMonotoneSmoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x.toFixed(2)} ${HEIGHT - PAD_BOTTOM} L ${first.x.toFixed(2)} ${HEIGHT - PAD_BOTTOM} Z`;
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

  const spanMs = useMemo(() => {
    if (!points || points.length < 2) return 0;
    const start = new Date(points[0].date).getTime();
    const end = new Date(points[points.length - 1].date).getTime();
    return Number.isFinite(start) && Number.isFinite(end) ? end - start : 0;
  }, [points]);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        {metric === "performance" ? "No resolved positions in this period" : "No trading activity in this period"}
      </div>
    );
  }

  const activePoint = hoverIndex !== null && points.length > 0 ? points[hoverIndex] : null;
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;
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
            <stop offset="0%" stopColor={palette.line} />
            <stop offset="100%" stopColor={palette.soft} />
          </linearGradient>
          <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.soft} stopOpacity="0.16" />
            <stop offset="100%" stopColor={palette.soft} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {gridLines.map((line, i) => (
          <line key={i} x1={0} y1={line.y} x2={WIDTH} y2={line.y} className="chart-grid-line" />
        ))}

        <path d={areaPath} fill={`url(#${areaGradientId})`} stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {lastPoint && (
          <g transform={`translate(${lastPoint.x}, ${lastPoint.y})`}>
            <circle r="3" fill={palette.line} />
            <line x1="0" y1="0" x2={WIDTH - lastPoint.x} y2="0" stroke={palette.line} strokeDasharray="2 2" strokeOpacity="0.4" />
          </g>
        )}

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

      {lastPoint && (
        <div
          className={`chart-end-marker tone-${tone}`}
          style={{ top: `${(lastPoint.y / HEIGHT) * 100}%` }}
        >
          {formatCompactCurrency(lastPoint.value)}
        </div>
      )}

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
            left: `${Math.min(84, Math.max(16, (activePoint.x / WIDTH) * 100))}%`,
            top: `${Math.min(75, Math.max(20, (activePoint.y / HEIGHT) * 100))}%`,
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
            {formatAxisTick(tick.t, range, spanMs)}
          </span>
        ))}
      </div>
    </div>
  );
}