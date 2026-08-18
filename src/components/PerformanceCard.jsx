import { useMemo, useState } from "react";
import PerformanceChart from "./PerformanceChart";
import { ChartSkeleton } from "./Skeleton";
import { formatCompactCurrency } from "../utils/formatters";

const RANGES = ["1D", "1W", "1M", "3M", "ALL"];

/**
 * Shows cumulative trading volume over time, derived from the account's
 * real activity feed. Framed as volume (not portfolio value) since a public
 * historical balance isn't something the public data sources expose.
 */
export default function PerformanceCard({ performance, loading }) {
  const [range, setRange] = useState("1M");
  const data = performance?.[range];

  const total = useMemo(() => (data && data.length > 0 ? data[data.length - 1].value : 0), [data]);

  return (
    <div className="card performance-card">
      <div className="performance-header">
        <div>
          <span className="card-label">Trading Activity</span>
          <div className="performance-value-row">
            <span className="performance-value">{formatCompactCurrency(total)}</span>
          </div>
          <div className="performance-change">
            <span>Cumulative volume traded</span>
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

      {loading || !performance ? <ChartSkeleton /> : <PerformanceChart data={data} volumeMode />}
    </div>
  );
}
