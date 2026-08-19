import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import PerformanceChart from "./PerformanceChart";
import { ChartSkeleton } from "./Skeleton";
import { usePerformanceRange } from "../hooks/usePerformanceRange";
import { formatCompactCurrency, formatPercentage, formatSignedCurrency } from "../utils/formatters";

const RANGES = ["1D", "1W", "1M", "3M", "ALL"];

/**
 * Cumulative trading volume for the selected timeframe. Each range is
 * fetched on demand through the active provider, so the headline value,
 * change, percentage and plotted series all come from that range's own
 * dataset. While a new range is loading the previous chart stays visible
 * (subtly dimmed) and the curve morphs smoothly into the new dataset once
 * it arrives.
 */
export default function PerformanceCard({ identifier }) {
  const [range, setRange] = useState("1M");
  const { status, data } = usePerformanceRange(identifier, range);
  const [lastData, setLastData] = useState(null);

  useEffect(() => {
    if (status === "ready" && data) setLastData(data);
  }, [status, data]);

  const hasIdentifier = Boolean(identifier);
  const loading = status === "loading" || !hasIdentifier;
  const perf = status === "ready" && data ? data : lastData;
  const readyForRange = status === "ready" && data && data.points && data.points.length > 0;
  const hasChart = perf && perf.points && perf.points.length > 0;

  return (
    <div className={`card performance-card ${loading ? "is-loading" : ""}`}>
      <div className="performance-header">
        <div>
          <span className="card-label">Trading Activity</span>
          <div className="performance-value-row">
            <span className="performance-value">
              {perf ? formatCompactCurrency(perf.total) : "--"}
            </span>
          </div>
          <div className="performance-change">
            {perf ? (
              <>
                <span className="performance-change-value">{formatSignedCurrency(perf.change)}</span>
                {perf.changePct != null && (
                  <span className="performance-change-pct">{formatPercentage(perf.changePct, { signed: true })}</span>
                )}
              </>
            ) : (
              <span>Cumulative volume traded</span>
            )}
          </div>
        </div>

        <div className="range-controls" role="group" aria-label="Performance time range">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={`range-btn ${range === r ? "is-active" : ""}`}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-area">
        {!hasIdentifier ? (
          <ChartSkeleton />
        ) : hasChart ? (
          <>
            <PerformanceChart data={readyForRange ? data.points : perf.points} volumeMode />
            {loading && (
              <div className="chart-loading-badge" role="status">
                <LoaderCircle size={13} className="spin" aria-hidden="true" />
                <span>Loading {range}…</span>
              </div>
            )}
          </>
        ) : loading ? (
          <ChartSkeleton />
        ) : (
          <div className="chart-empty">No trading activity in this period</div>
        )}
      </div>
    </div>
  );
}