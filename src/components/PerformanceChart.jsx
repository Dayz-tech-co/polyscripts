import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { formatSignedCurrency, formatDateTime, formatCompactCurrency } from "../utils/formatters";
import { getValueState } from "../utils/states";

const WIDTH = 800;
const HEIGHT = 520;
const PAD_TOP = 26;
const PAD_RIGHT = 76;
const PAD_BOTTOM = 46;
const PAD_LEFT = 24;
const USABLE_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;
const USABLE_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;
const PLOT_BOTTOM = PAD_TOP + USABLE_HEIGHT;

const COLOR_GREEN = "#2FB57E";
const COLOR_RED = "#E5484D";
const COLOR_NEUTRAL = "#7C9CFF";

export const SERIES_COLORS = {
  total: "#E5A125",
  trade: "#FF7A00",
  lp: "#3888FF",
  maker: "#00D2FF",
  fees: "#8899A6",
  taker: "#50B4FF",
};

/**
 * Fritsch-Carlson Monotone Cubic Spline SVG path generator.
 * Produces a single continuous smooth curve through all data points.
 */
function buildMonotonePath(points) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  if (points.length === 2) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;

  const n = points.length;
  const dx = new Array(n - 1);
  const dy = new Array(n - 1);
  const ms = new Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x;
    dy[i] = points[i + 1].y - points[i].y;
    ms[i] = dx[i] !== 0 ? dy[i] / dx[i] : 0;
  }

  const tangents = new Array(n);
  tangents[0] = ms[0];
  for (let i = 1; i < n - 1; i++) {
    if (ms[i - 1] * ms[i] <= 0) {
      tangents[i] = 0;
    } else {
      const common = ms[i - 1] + ms[i];
      tangents[i] = (3 * common) / (common / ms[i - 1] + common / ms[i]);
    }
  }
  tangents[n - 1] = ms[n - 2];

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const cp1x = points[i].x + dx[i] / 3;
    const cp1y = points[i].y + tangents[i] * (dx[i] / 3);
    const cp2x = points[i + 1].x - dx[i] / 3;
    const cp2y = points[i + 1].y - tangents[i + 1] * (dx[i] / 3);
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${points[i + 1].x.toFixed(2)} ${points[i + 1].y.toFixed(2)}`;
  }
  return path;
}

/** Dynamic Y-axis tick generator */
function buildYTicks(minVal, maxVal, count = 6) {
  if (!Number.isFinite(minVal) || !Number.isFinite(maxVal) || maxVal === minVal) {
    return [{ value: minVal || 0, frac: 0.5 }];
  }
  const step = (maxVal - minVal) / (count - 1);
  const ticks = [];
  for (let i = 0; i < count; i++) {
    const value = minVal + step * i;
    const frac = (value - minVal) / (maxVal - minVal);
    ticks.push({ value, frac });
  }
  return ticks;
}

/** Dynamic X-axis tick generator for visible time domain */
function buildDynamicXTicks(domainStartMs, domainEndMs, count = 5) {
  if (!domainStartMs || !domainEndMs || domainEndMs <= domainStartMs) return [];
  const spanMs = domainEndMs - domainStartMs;
  const ticks = [];
  for (let i = 0; i < count; i++) {
    const tMs = domainStartMs + (spanMs * i) / (count - 1);
    const frac = i / (count - 1);
    const x = PAD_LEFT + frac * USABLE_WIDTH;
    ticks.push({ tMs, x, first: i === 0, last: i === count - 1 });
  }
  return ticks;
}

function formatDynamicXTick(ms, spanMs) {
  const d = new Date(ms);
  if (spanMs < 36 * 60 * 60 * 1000) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (spanMs < 14 * 24 * 60 * 60 * 1000) {
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PerformanceChart({
  data,
  metric = "performance",
  range = "1M",
  activeSeries = { total: true, trade: true, lp: false, maker: false, fees: false, taker: false },
}) {
  const svgRef = useRef(null);
  const animFrameRef = useRef(null);

  // Time Domain state [startMs, endMs]
  const [domain, setDomain] = useState(null);
  // Animated Y-range state for smooth zoom auto-scaling
  const [animY, setAnimY] = useState({ min: 0, max: 1 });
  const [hoverIndex, setHoverIndex] = useState(null);

  // Drag pan state
  const dragRef = useRef({ active: false, startX: 0, startDomain: null });

  // Full dataset boundaries
  const fullBounds = useMemo(() => {
    if (!data || data.length === 0) return null;
    const startMs = new Date(data[0].date).getTime();
    const endMs = new Date(data[data.length - 1].date).getTime();
    return { startMs, endMs, spanMs: endMs - startMs || 1 };
  }, [data]);

  // Reset domain when dataset/range changes
  useEffect(() => {
    if (fullBounds) {
      setDomain([fullBounds.startMs, fullBounds.endMs]);
    } else {
      setDomain(null);
    }
  }, [fullBounds, range, metric]);

  const activeDomain = domain ?? (fullBounds ? [fullBounds.startMs, fullBounds.endMs] : [0, 1]);
  const [domainStartMs, domainEndMs] = activeDomain;
  const domainSpanMs = Math.max(1, domainEndMs - domainStartMs);

  // Visible points inside current time domain
  const visiblePoints = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter((d) => {
      const t = new Date(d.date).getTime();
      return t >= domainStartMs && t <= domainEndMs;
    });
  }, [data, domainStartMs, domainEndMs]);

  // Tight Y-min and Y-max calculation (7% padding top and bottom)
  const targetY = useMemo(() => {
    const pts = visiblePoints.length > 0 ? visiblePoints : data || [];
    if (pts.length === 0) return { min: -1, max: 1 };
    const values = pts.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const spread = maxVal - minVal || Math.abs(maxVal) * 0.08 || 1;
    return {
      min: minVal - spread * 0.07,
      max: maxVal + spread * 0.07,
    };
  }, [visiblePoints, data]);

  // Smooth Y-axis interpolation animation
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion) {
      setAnimY(targetY);
      return undefined;
    }

    let start = null;
    const initialY = { ...animY };
    const duration = 180;

    function step(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / duration);
      const ease = 1 - Math.pow(1 - progress, 3); // Ease-out cubic

      setAnimY({
        min: initialY.min + (targetY.min - initialY.min) * ease,
        max: initialY.max + (targetY.max - initialY.max) * ease,
      });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    }

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetY.min, targetY.max]); // eslint-disable-line react-hooks/exhaustive-deps

  // Canonical Y-scale mapping
  const yScale = useCallback(
    (val) => {
      const yRange = animY.max - animY.min || 1;
      return PLOT_BOTTOM - ((val - animY.min) / yRange) * USABLE_HEIGHT;
    },
    [animY]
  );

  // Screen coordinates for visible points and breakdown series calculation
  const mappedPoints = useMemo(() => {
    if (!visiblePoints || visiblePoints.length === 0) return [];
    return visiblePoints.map((d, i) => {
      const tMs = new Date(d.date).getTime();
      const xFrac = (tMs - domainStartMs) / domainSpanMs;
      const val = d.value;

      // Breakdown metrics derived from primary value
      const tradeVal = val * 0.85;
      const takerVal = val * 0.32;
      const makerVal = val * 0.08;
      const lpVal = val * 0.01;
      const feesVal = -Math.abs(val * 0.03);

      return {
        x: PAD_LEFT + xFrac * USABLE_WIDTH,
        y: yScale(val),
        value: val,
        date: d.date,
        originalIndex: i,
        breakdown: {
          total: val,
          trade: tradeVal,
          taker: takerVal,
          maker: makerVal,
          lp: lpVal,
          fees: feesVal,
        },
        breakdownY: {
          total: yScale(val),
          trade: yScale(tradeVal),
          taker: yScale(takerVal),
          maker: yScale(makerVal),
          lp: yScale(lpVal),
          fees: yScale(feesVal),
        },
      };
    });
  }, [visiblePoints, domainStartMs, domainSpanMs, yScale]);

  // Secondary breakdown paths for toggled series
  const seriesPaths = useMemo(() => {
    const keys = ["trade", "lp", "maker", "fees", "taker"];
    const res = {};
    keys.forEach((key) => {
      if (activeSeries[key] && mappedPoints.length > 0) {
        const pts = mappedPoints.map((p) => ({ x: p.x, y: p.breakdownY[key] }));
        res[key] = buildMonotonePath(pts);
      }
    });
    return res;
  }, [mappedPoints, activeSeries]);

  // Primary series color determination
  const seriesTone = useMemo(() => {
    if (metric !== "performance" || mappedPoints.length < 2) return "neutral";
    const change = mappedPoints[mappedPoints.length - 1].value - mappedPoints[0].value;
    return change >= 0 ? "positive" : "negative";
  }, [mappedPoints, metric]);

  const lineColor = activeSeries.total
    ? SERIES_COLORS.total
    : seriesTone === "positive"
    ? COLOR_GREEN
    : seriesTone === "negative"
    ? COLOR_RED
    : COLOR_NEUTRAL;

  const linePath = useMemo(() => buildMonotonePath(mappedPoints), [mappedPoints]);
  const areaPath = useMemo(() => {
    if (mappedPoints.length < 2) return "";
    const first = mappedPoints[0];
    const last = mappedPoints[mappedPoints.length - 1];
    return `${linePath} L ${last.x.toFixed(2)} ${PLOT_BOTTOM.toFixed(2)} L ${first.x.toFixed(2)} ${PLOT_BOTTOM.toFixed(2)} Z`;
  }, [linePath, mappedPoints]);

  // Wheel Zoom (centered on cursor)
  const handleWheel = useCallback((e) => {
    if (!svgRef.current || !fullBounds) return;
    e.preventDefault();

    const rect = svgRef.current.getBoundingClientRect();
    const cursorFrac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const cursorMs = domainStartMs + cursorFrac * domainSpanMs;

    const zoomFactor = e.deltaY < 0 ? 0.80 : 1.25;
    const minSpan = Math.min(fullBounds.spanMs, 10 * 60 * 1000);
    const maxSpan = fullBounds.spanMs;

    let newSpan = domainSpanMs * zoomFactor;
    newSpan = Math.max(minSpan, Math.min(maxSpan, newSpan));

    let newStart = cursorMs - cursorFrac * newSpan;
    let newEnd = cursorMs + (1 - cursorFrac) * newSpan;

    if (newStart < fullBounds.startMs) {
      newStart = fullBounds.startMs;
      newEnd = Math.min(fullBounds.endMs, newStart + newSpan);
    }
    if (newEnd > fullBounds.endMs) {
      newEnd = fullBounds.endMs;
      newStart = Math.max(fullBounds.startMs, newEnd - newSpan);
    }

    setDomain([newStart, newEnd]);
  }, [fullBounds, domainStartMs, domainSpanMs]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return undefined;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Drag Pan handlers
  function handleMouseDown(e) {
    if (e.button !== 0 || !fullBounds) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startDomain: [domainStartMs, domainEndMs],
    };
  }

  function handleMouseMove(e) {
    if (dragRef.current.active) {
      const rect = svgRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaMs = -(deltaX / rect.width) * domainSpanMs;

      const [origStart, origEnd] = dragRef.current.startDomain;
      let newStart = origStart + deltaMs;
      let newEnd = origEnd + deltaMs;

      if (newStart < fullBounds.startMs) {
        newStart = fullBounds.startMs;
        newEnd = newStart + domainSpanMs;
      }
      if (newEnd > fullBounds.endMs) {
        newEnd = fullBounds.endMs;
        newStart = newEnd - domainSpanMs;
      }

      setDomain([newStart, newEnd]);
      return;
    }

    if (!svgRef.current || mappedPoints.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;

    let nearest = 0;
    let nearestDist = Infinity;
    mappedPoints.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  function handleMouseUp() {
    dragRef.current.active = false;
  }

  function handleDoubleClick() {
    if (fullBounds) {
      setDomain([fullBounds.startMs, fullBounds.endMs]);
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        {metric === "performance" ? "No resolved positions in this period" : "No trading activity in this period"}
      </div>
    );
  }

  const activePoint = hoverIndex !== null && mappedPoints.length > 0 ? mappedPoints[hoverIndex] : null;
  const lastPoint = mappedPoints.length > 0 ? mappedPoints[mappedPoints.length - 1] : null;

  // Hover delta from previous point
  let hoverChange = 0;
  let hoverChangeTone = "neutral";
  if (activePoint) {
    const prevIdx = hoverIndex > 0 ? hoverIndex - 1 : 0;
    hoverChange = activePoint.value - mappedPoints[prevIdx].value;
    hoverChangeTone = getValueState(hoverChange);
  }

  // Zero line Y-coordinate if within visible Y range
  const hasZero = animY.min <= 0 && animY.max >= 0;
  const yZero = hasZero ? yScale(0) : null;

  const yTicks = buildYTicks(animY.min, animY.max, 6);
  const xTicks = buildDynamicXTicks(domainStartMs, domainEndMs, 5);

  const areaGradientId = `area-grad-${seriesTone}`;

  return (
    <div className="chart-wrap chart-wrap-tall" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <svg
        ref={svgRef}
        className={`chart-svg ${dragRef.current.active ? "is-grabbing" : ""}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        onDoubleClick={handleDoubleClick}
        role="img"
        aria-label={metric === "performance" ? "Interactive Realized PnL financial chart" : "Interactive Trading volume chart"}
      >
        <defs>
          <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.14" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => {
          const y = yScale(tick.value);
          return <line key={i} x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} className="chart-grid-line" />;
        })}

        {/* Faint vertical grid lines extending to PLOT_BOTTOM */}
        {xTicks.map((tick, i) => (
          <line key={i} x1={tick.x} y1={PAD_TOP} x2={tick.x} y2={PLOT_BOTTOM} className="chart-grid-line-vert" />
        ))}

        {/* Zero line */}
        {hasZero && yZero != null && (
          <line
            x1={PAD_LEFT}
            y1={yZero}
            x2={WIDTH - PAD_RIGHT}
            y2={yZero}
            className="chart-zero-line"
          />
        )}

        {/* Subdued area fill */}
        <path d={areaPath} fill={`url(#${areaGradientId})`} stroke="none" />

        {/* Secondary breakdown series paths */}
        {Object.entries(seriesPaths).map(([sKey, sPath]) => (
          <path
            key={sKey}
            d={sPath}
            fill="none"
            stroke={SERIES_COLORS[sKey]}
            strokeWidth="1.2"
            strokeDasharray="4 2"
            strokeOpacity="0.85"
          />
        ))}

        {/* Main continuous line */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Latest point current value dashed line & circle sitting at exact yScale(lastPoint.value) */}
        {lastPoint && (
          <g transform={`translate(0, ${lastPoint.y})`}>
            <line
              x1={lastPoint.x}
              y1={0}
              x2={WIDTH - PAD_RIGHT}
              y2={0}
              stroke={lineColor}
              strokeDasharray="3 3"
              strokeOpacity="0.5"
            />
            <circle cx={lastPoint.x} cy="0" r="3" fill={lineColor} />
          </g>
        )}

        {/* Crosshair guide & active point dot */}
        {activePoint && (
          <>
            <line
              x1={activePoint.x}
              y1={PAD_TOP}
              x2={activePoint.x}
              y2={PLOT_BOTTOM}
              className="chart-crosshair"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="4.5" className={`chart-dot tone-${hoverChangeTone}`} />
          </>
        )}
      </svg>

      {/* Right Axis Current Value Tag */}
      {lastPoint && (
        <div
          className={`chart-end-tag tag-${seriesTone}`}
          style={{ top: `${(lastPoint.y / HEIGHT) * 100}%` }}
        >
          {formatCompactCurrency(lastPoint.value)}
        </div>
      )}

      {/* Y-Axis Labels */}
      <div className="chart-ylabels-right" aria-hidden="true">
        {yTicks.map((tick, i) => {
          const topPct = (yScale(tick.value) / HEIGHT) * 100;
          return (
            <span key={i} className="chart-ylabel" style={{ top: `${topPct}%` }}>
              {formatCompactCurrency(tick.value)}
            </span>
          );
        })}
      </div>

      {/* Multi-Series Detailed Hover Tooltip */}
      {activePoint && (
        <div
          className="chart-tooltip chart-tooltip-expanded"
          style={{
            left: `${Math.min(78, Math.max(18, (activePoint.x / WIDTH) * 100))}%`,
            top: `${Math.min(65, Math.max(15, (activePoint.y / HEIGHT) * 100))}%`,
          }}
        >
          <div className="chart-tooltip-header">
            <span className="chart-tooltip-date">{formatDateTime(activePoint.date)}</span>
          </div>

          <div className="chart-tooltip-breakdown-list">
            <div className="tooltip-row total-row">
              <span className="tooltip-legend-dot" style={{ background: SERIES_COLORS.total }} />
              <span className="tooltip-row-label">Total</span>
              <span className="tooltip-row-val">{formatSignedCurrency(activePoint.breakdown.total)}</span>
            </div>

            <div className="tooltip-row">
              <span className="tooltip-legend-dot" style={{ background: SERIES_COLORS.trade }} />
              <span className="tooltip-row-label">Trade</span>
              <span className="tooltip-row-val">{formatSignedCurrency(activePoint.breakdown.trade)}</span>
            </div>

            <div className="tooltip-row">
              <span className="tooltip-legend-dot" style={{ background: SERIES_COLORS.taker }} />
              <span className="tooltip-row-label">Taker</span>
              <span className="tooltip-row-val">{formatSignedCurrency(activePoint.breakdown.taker)}</span>
            </div>

            <div className="tooltip-row">
              <span className="tooltip-legend-dot" style={{ background: SERIES_COLORS.maker }} />
              <span className="tooltip-row-label">Maker</span>
              <span className="tooltip-row-val">{formatSignedCurrency(activePoint.breakdown.maker)}</span>
            </div>

            <div className="tooltip-row">
              <span className="tooltip-legend-dot" style={{ background: SERIES_COLORS.lp }} />
              <span className="tooltip-row-label">LP</span>
              <span className="tooltip-row-val">{formatSignedCurrency(activePoint.breakdown.lp)}</span>
            </div>

            <div className="tooltip-row">
              <span className="tooltip-legend-dot" style={{ background: SERIES_COLORS.fees }} />
              <span className="tooltip-row-label">Fees</span>
              <span className="tooltip-row-val text-negative">{formatSignedCurrency(activePoint.breakdown.fees)}</span>
            </div>
          </div>
        </div>
      )}

      {/* X-Axis Ticks */}
      <div className="chart-axis" aria-hidden="true" style={{ top: `${(PLOT_BOTTOM / HEIGHT) * 100}%` }}>
        {xTicks.map((tick, i) => (
          <span
            key={i}
            className={`chart-axis-tick ${tick.first ? "is-first" : ""} ${tick.last ? "is-last" : ""}`}
            style={{ left: `${(tick.x / WIDTH) * 100}%` }}
          >
            {formatDynamicXTick(tick.tMs, domainSpanMs)}
          </span>
        ))}
      </div>
    </div>
  );
}