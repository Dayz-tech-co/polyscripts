import { useState } from "react";
import PerformanceChart from "./PerformanceChart";
import { ChartSkeleton } from "./Skeleton";
import { usePerformanceRange } from "../hooks/usePerformanceRange";
import { formatCompactCurrency, formatPercentage, formatSignedCurrency } from "../utils/formatters";

const RANGES = ["1D", "1W", "1M", "3M", "ALL"];

/**
 * Cumulative trading volume for the selected timeframe. Each range is
 * fetched on demand through the active provider, so the headline value,
 * change, percentage and plotted series all come from that range's own
 * dataset. While a range is loading the previous series is withheld and a
 * subtle skeleton is shown in its place.
 */
export default function PerformanceCard({ identifier }) {
  const [range, setRange] = useState("1M");
  const { status, data } = usePerformanceRange(identifier, range);

  const loading = status === "loading" || !identifier;
  const perf = status === "ready" && data ? data : null;

  return (
    <div className="card performance-card">
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

      {loading ? (
        <ChartSkeleton />
      ) : perf && perf.points && perf.points.length > 0 ? (
        <PerformanceChart data={perf.points} volumeMode />
      ) : (
        <div className="chart-empty">No trading activity in this period</div>
      )}
    </div>
  );
}