import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { formatCurrency, formatSignedCurrency, formatDateTime, formatCompactCurrency } from "../utils/formatters";
import { getValueState } from "../utils/states";

const WIDTH = 800;
const HEIGHT = 440;
const PAD_TOP = 28;
const PAD_RIGHT = 76;
const PAD_BOTTOM = 48;
const PAD_LEFT = 20;
const USABLE_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT;
const USABLE_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM;

const COLOR_UP = "#2FB57E";
const COLOR_DOWN = "#E5484D";
const COLOR_NEUTRAL = "#7C9CFF";

/**
 * Fritsch-Carlson Monotone Cubic Spline control points generator.
 * Produces control points for point[i] to point[i+1] without overshooting extrema.
 */
function computeMonotoneTangents(pts) {
  const n = pts.length;
  if (n < 2) return [];
  const dx = new Array(n - 1);
  const dy = new Array(n - 1);
  const ms = new Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    dy[i] = pts[i + 1].y - pts[i].y;
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
  return { dx, tangents };
}

function buildSegmentBezierPath(p0, p1, t0, t1, dx) {
  if (dx === 0) return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  const cp1x = p0.x + dx / 3;
  const cp1y = p0.y + t0 * (dx / 3);
  const cp2x = p1.x - dx / 3;
  const cp2y = p1.y - t1 * (dx / 3);
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
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

export default function PerformanceChart({ data, metric = "performance", range = "1M" }) {
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

  // Target Y-min and Y-max for visible points
  const targetY = useMemo(() => {
    const pts = visiblePoints.length > 0 ? visiblePoints : data || [];
    if (pts.length === 0) return { min: -1, max: 1 };
    const values = pts.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const spread = maxVal - minVal || Math.abs(maxVal) * 0.1 || 1;
    return {
      min: minVal - spread * 0.10,
      max: maxVal + spread * 0.10,
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
      const ease = 1 - Math.pow(1 - progress, 3);

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

  // Screen coordinates for visible points
  const mappedPoints = useMemo(() => {
    if (!visiblePoints || visiblePoints.length === 0) return [];
    const yRange = animY.max - animY.min || 1;

    return visiblePoints.map((d, i) => {
      const tMs = new Date(d.date).getTime();
      const xFrac = (tMs - domainStartMs) / domainSpanMs;
      const yFrac = (d.value - animY.min) / yRange;
      return {
        x: PAD_LEFT + xFrac * USABLE_WIDTH,
        y: PAD_TOP + USABLE_HEIGHT - yFrac * USABLE_HEIGHT,
        value: d.value,
        date: d.date,
        originalIndex: i,
      };
    });
  }, [visiblePoints, domainStartMs, domainSpanMs, animY]);

  // Movement-based Segment Paths (Green for recovery/up, Red for drawdown/down)
  const segments = useMemo(() => {
    if (mappedPoints.length < 2) return [];
    const { dx, tangents } = computeMonotoneTangents(mappedPoints);
    const list = [];

    for (let i = 0; i < mappedPoints.length - 1; i++) {
      const p0 = mappedPoints[i];
      const p1 = mappedPoints[i + 1];
      const isUp = p1.value > p0.value;
      const isDown = p1.value < p0.value;

      let color = COLOR_NEUTRAL;
      if (metric === "performance") {
        color = isUp ? COLOR_UP : isDown ? COLOR_DOWN : list[i - 1]?.color || COLOR_NEUTRAL;
      }

      const d = buildSegmentBezierPath(p0, p1, tangents[i], tangents[i + 1], dx[i]);
      list.push({ d, color, isUp, isDown });
    }
    return list;
  }, [mappedPoints, metric]);

  // Combined area path for translucent neutral fill
  const areaPath = useMemo(() => {
    if (mappedPoints.length < 2) return "";
    const first = mappedPoints[0];
    const last = mappedPoints[mappedPoints.length - 1];
    let path = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;

    if (segments.length > 0) {
      for (const seg of segments) {
        path += seg.d.replace(/^M [0-9.]+\s+[0-9.]+/, "");
      }
    }
    path += ` L ${last.x.toFixed(2)} ${HEIGHT - PAD_BOTTOM} L ${first.x.toFixed(2)} ${HEIGHT - PAD_BOTTOM} Z`;
    return path;
  }, [mappedPoints, segments]);

  // Wheel Zoom (centered on cursor)
  const handleWheel = useCallback((e) => {
    if (!svgRef.current || !fullBounds) return;
    e.preventDefault();

    const rect = svgRef.current.getBoundingClientRect();
    const cursorFrac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const cursorMs = domainStartMs + cursorFrac * domainSpanMs;

    const zoomFactor = e.deltaY < 0 ? 0.80 : 1.25;
    const minSpan = Math.min(fullBounds.spanMs, 10 * 60 * 1000); // 10 min minimum
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

  // Attach non-passive wheel event listener to SVG to prevent page scroll while zooming
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

    // Hover crosshair lookup
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
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : null;

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
  const yZero = hasZero ? PAD_TOP + USABLE_HEIGHT - ((0 - animY.min) / (animY.max - animY.min)) * USABLE_HEIGHT : null;

  // Dynamic Y ticks
  const yTicks = buildYTicks(animY.min, animY.max, 6);
  // Dynamic X ticks
  const xTicks = buildDynamicXTicks(domainStartMs, domainEndMs, 5);

  return (
    <div className="chart-wrap chart-wrap-tall" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <svg
        ref={svgRef}
        className={`chart-svg ${dragRef.current.active ? "is-grabbing" : ""}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        onDoubleClick={handleDoubleClick}
        role="img"
        aria-label={metric === "performance" ? "Interactive Realized PnL financial chart" : "Interactive Trading volume chart"}
      >
        <defs>
          <linearGradient id="neutral-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124, 156, 255, 0.08)" />
            <stop offset="100%" stopColor="rgba(124, 156, 255, 0.0)" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => {
          const y = PAD_TOP + USABLE_HEIGHT - tick.frac * USABLE_HEIGHT;
          return <line key={i} x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} className="chart-grid-line" />;
        })}

        {/* Faint vertical grid lines */}
        {xTicks.map((tick, i) => (
          <line key={i} x1={tick.x} y1={PAD_TOP} x2={tick.x} y2={HEIGHT - PAD_BOTTOM} className="chart-grid-line-vert" />
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

        {/* Translucent neutral area fill */}
        <path d={areaPath} fill="url(#neutral-area-fill)" stroke="none" />

        {/* Directional Segment Paths (Green for recovery, Red for drawdown) */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.d}
            fill="none"
            stroke={seg.color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Latest point current value dashed line & end tag */}
        {lastPoint && (
          <g transform={`translate(0, ${lastPoint.y})`}>
            <line
              x1={lastPoint.x}
              y1={0}
              x2={WIDTH - PAD_RIGHT}
              y2={0}
              stroke={lastSegment?.color || COLOR_NEUTRAL}
              strokeDasharray="3 3"
              strokeOpacity="0.5"
            />
            <circle cx={lastPoint.x} cy="0" r="3" fill={lastSegment?.color || COLOR_NEUTRAL} />
          </g>
        )}

        {/* Crosshair guide & active point dot */}
        {activePoint && (
          <>
            <line
              x1={activePoint.x}
              y1={PAD_TOP}
              x2={activePoint.x}
              y2={HEIGHT - PAD_BOTTOM}
              className="chart-crosshair"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="4.5" className={`chart-dot tone-${hoverChangeTone}`} />
          </>
        )}
      </svg>

      {/* Right Axis Current Value Tag */}
      {lastPoint && (
        <div
          className={`chart-end-tag ${lastSegment?.isUp ? "tag-up" : lastSegment?.isDown ? "tag-down" : ""}`}
          style={{ top: `${(lastPoint.y / HEIGHT) * 100}%` }}
        >
          {formatCompactCurrency(lastPoint.value)}
        </div>
      )}

      {/* Y-Axis Labels (Right-aligned) */}
      <div className="chart-ylabels-right" aria-hidden="true">
        {yTicks.map((tick, i) => {
          const topPct = ((PAD_TOP + USABLE_HEIGHT - tick.frac * USABLE_HEIGHT) / HEIGHT) * 100;
          return (
            <span key={i} className="chart-ylabel" style={{ top: `${topPct}%` }}>
              {formatCompactCurrency(tick.value)}
            </span>
          );
        })}
      </div>

      {/* Hover Tooltip snapped to real point */}
      {activePoint && (
        <div
          className="chart-tooltip"
          style={{
            left: `${Math.min(82, Math.max(16, (activePoint.x / WIDTH) * 100))}%`,
            top: `${Math.min(75, Math.max(18, (activePoint.y / HEIGHT) * 100))}%`,
          }}
        >
          <div className="chart-tooltip-date">{formatDateTime(activePoint.date)}</div>
          <div className="chart-tooltip-metric">{metric === "performance" ? "Realized PnL" : "Trading Volume"}</div>
          <div className="chart-tooltip-value">
            {metric === "performance" ? formatSignedCurrency(activePoint.value) : formatCurrency(activePoint.value)}
          </div>
          {hoverIndex > 0 && (
            <div className={`chart-tooltip-pnl tone-${hoverChangeTone}`}>
              Step {formatSignedCurrency(hoverChange)}
            </div>
          )}
        </div>
      )}

      {/* X-Axis Ticks */}
      <div className="chart-axis" aria-hidden="true">
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