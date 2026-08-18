import { useMemo, useRef, useState } from "react";
import { formatCurrency, formatSignedCurrency, formatDate } from "../utils/formatters";

const WIDTH = 640;
const HEIGHT = 220;
const PAD_TOP = 14;
const PAD_BOTTOM = 24;
const PAD_X = 4;

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

export default function PerformanceChart({ data, positive = true, volumeMode = false }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const { points, gridLines } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], gridLines: [] };
    }
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || max * 0.1 || 1;
    const paddedMin = min - range * 0.12;
    const paddedMax = max + range * 0.12;
    const paddedRange = paddedMax - paddedMin || 1;

    const usableWidth = WIDTH - PAD_X * 2;
    const usableHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

    const pts = data.map((d, i) => ({
      x: PAD_X + (i / (data.length - 1 || 1)) * usableWidth,
      y: PAD_TOP + usableHeight - ((d.value - paddedMin) / paddedRange) * usableHeight,
      value: d.value,
      date: d.date,
    }));

    const lines = [0, 0.25, 0.5, 0.75, 1].map((t) => PAD_TOP + t * usableHeight);

    return { points: pts, gridLines: lines };
  }, [data]);

  const linePath = useMemo(() => buildSmoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x} ${HEIGHT - PAD_BOTTOM} L ${first.x} ${HEIGHT - PAD_BOTTOM} Z`;
  }, [linePath, points]);

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

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;
  const firstValue = points[0]?.value ?? 0;
  const hoverPnl = activePoint ? activePoint.value - firstValue : 0;

  const tone = positive ? "positive" : "negative";
  const gradientId = "performance-line-gradient";
  const areaGradientId = "performance-area-gradient";

  if (!data || data.length === 0) {
    return <div className="chart-empty">No trading activity in this period</div>;
  }

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
        aria-label={volumeMode ? "Cumulative trading volume chart" : "Portfolio performance chart"}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            {positive ? (
              <>
                <stop offset="0" stopColor="#FF8A18" />
                <stop offset="0.55" stopColor="#FF5C45" />
                <stop offset="1" stopColor="#ED1976" />
              </>
            ) : (
              <>
                <stop offset="0" stopColor="#E5484D" />
                <stop offset="1" stopColor="#E5484D" />
              </>
            )}
          </linearGradient>
          <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={positive ? "#FF5C45" : "#E5484D"} stopOpacity="0.22" />
            <stop offset="1" stopColor={positive ? "#FF5C45" : "#E5484D"} stopOpacity="0" />
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
            <circle cx={activePoint.x} cy={activePoint.y} r="4" className={`chart-dot tone-${tone}`} />
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
          {!volumeMode && (
            <div className={`chart-tooltip-pnl tone-${hoverPnl >= 0 ? "positive" : "negative"}`}>
              {formatSignedCurrency(hoverPnl)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
