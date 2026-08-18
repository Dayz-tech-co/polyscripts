import { useEffect, useMemo, useState } from "react";
import PerformanceChart from "./PerformanceChart";
import { ChartSkeleton } from "./Skeleton";
import { getPerformance } from "../services/profileService";
import { formatCurrency, formatPercentage, formatSignedCurrency } from "../utils/formatters";

const RANGES = ["1D", "1W", "1M", "3M", "ALL"];

export default function PerformanceCard() {
  const [range, setRange] = useState("1M");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPerformance(range).then((series) => {
      if (active) {
        setData(series);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [range]);

  const { pnl, pnlPercent, endValue, positive } = useMemo(() => {
    if (!data || data.length === 0) return { pnl: 0, pnlPercent: 0, endValue: 0, positive: true };
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = last - first;
    return {
      pnl: change,
      pnlPercent: first !== 0 ? change / first : 0,
      endValue: last,
      positive: change >= 0,
    };
  }, [data]);

  return (
    <div className="card performance-card">
      <div className="performance-header">
        <div>
          <span className="card-label">Performance</span>
          <div className="performance-value-row">
            <span className="performance-value">{formatCurrency(endValue)}</span>
          </div>
          <div className={`performance-change tone-${positive ? "positive" : "negative"}`}>
            {formatSignedCurrency(pnl)}
            <span className="performance-change-pct">{formatPercentage(pnlPercent, { signed: true })}</span>
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

      {loading || !data ? <ChartSkeleton /> : <PerformanceChart data={data} positive={positive} />}
    </div>
  );
}
