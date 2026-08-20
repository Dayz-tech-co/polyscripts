import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import PerformanceChart from "./PerformanceChart";
import { ChartSkeleton } from "./Skeleton";
import { usePerformanceRange } from "../hooks/usePerformanceRange";
import { getPerformanceRange } from "../services/profileService";
import { formatCompactCurrency, formatCurrency, formatSignedCurrency } from "../utils/formatters";
import { getToneClass } from "../utils/states";

const RANGES = ["1D", "1W", "1M", "3M", "ALL"];
const RANGE_LABELS = { "1D": "Last 24 hours", "1W": "Last 7 days", "1M": "Last 30 days", "3M": "Last 90 days", ALL: "Available history" };

// 5 standard timeframe result cards below the chart
const SUMMARY_RANGES = [
  { label: "1D", range: "1D" },
  { label: "7D", range: "1W" },
  { label: "30D", range: "1M" },
  { label: "90D", range: "3M" },
  { label: "Available History", range: "ALL" },
];

const METRICS = [
  { key: "performance", label: "Performance" },
  { key: "volume", label: "Volume" },
];

function useRangeSummary(identifier, metric) {
  const [summary, setSummary] = useState({ loading: false, data: {} });

  useEffect(() => {
    if (!identifier) {
      setSummary({ loading: false, data: {} });
      return undefined;
    }
    let cancelled = false;
    setSummary((prev) => ({ ...prev, loading: true }));

    Promise.all(
      SUMMARY_RANGES.map(({ range }) =>
        getPerformanceRange(identifier, { range, metric }).then((data) => [range, data]).catch(() => [range, null]),
      ),
    ).then((entries) => {
      if (cancelled) return;
      const data = Object.fromEntries(entries);
      setSummary({ loading: false, data });
    });

    return () => {
      cancelled = true;
    };
  }, [identifier, metric]);

  return summary;
}

import { useEffect } from "react";

export default function PerformanceCard({ identifier }) {
  const [range, setRange] = useState("ALL");
  const [metric, setMetric] = useState("performance");
  const { status, data } = usePerformanceRange(identifier, range, metric);
  const { loading: summaryLoading, data: summary } = useRangeSummary(identifier, metric);

  const hasIdentifier = Boolean(identifier);
  const loading = status === "loading" || !hasIdentifier;
  const perf = status === "ready" && data && data.metric === metric && data.range === range ? data : null;
  const hasChart = Boolean(perf && perf.points && perf.points.length > 0);
  const isVolume = metric === "volume";
  const headlineTone = isVolume || !perf ? "" : getToneClass(perf.change);

  function handleMetric(next) {
    if (next === metric) return;
    setMetric(next);
  }

  function handleSummaryRange(range) {
    setRange(range);
  }

  return (
    <div className={`card performance-card ${loading ? "is-loading" : ""}`}>
      <div className="performance-header">
        <div>
          <div className="performance-title-row">
            <span className="card-label">Performance</span>
            <div className="metric-toggle" role="group" aria-label="Chart metric">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`metric-btn ${metric === m.key ? "is-active" : ""}`}
                  onClick={() => handleMetric(m.key)}
                  aria-pressed={metric === m.key}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="performance-value-row">
            <span className={`performance-value ${headlineTone}`}>
              {perf
                ? isVolume
                  ? formatCompactCurrency(perf.change)
                  : formatSignedCurrency(perf.change)
                : "N/A"}
            </span>
            <span className="performance-value-suffix">
              {perf ? (isVolume ? "volume" : "pnl") : ""} · {RANGE_LABELS[range]}
            </span>
          </div>
          <div className="performance-change">
            {!perf ? (
              <span className="performance-change-pct">
                {isVolume ? "Trading volume in this period" : "Realized PnL from resolved positions"}
              </span>
            ) : isVolume ? (
              <span className="performance-change-pct">Cumulative volume traded</span>
            ) : (
              <span className="performance-change-pct">Realized PnL this period</span>
            )}
          </div>
          {perf && (
            <div className="performance-note">
              Cumulative {formatCurrency(perf.endValue ?? perf.total)}
              {isVolume ? " notional traded" : " realized PnL"}
            </div>
          )}
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
              {r === "ALL" ? "All" : r}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-area chart-area-expanded">
        {!hasIdentifier ? (
          <ChartSkeleton />
        ) : hasChart ? (
          <>
            <PerformanceChart data={perf.points} metric={metric} range={range} startValue={perf.startValue ?? 0} />
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
          <div className="chart-empty">
            {isVolume ? "No trading activity in this period" : "No resolved positions in this period"}
          </div>
        )}
      </div>

      <div className={`range-summary range-summary-five ${summaryLoading ? "is-loading" : ""}`} role="group" aria-label="Timeframe result cards">
        {SUMMARY_RANGES.map(({ label, range: sumRange }) => {
          const item = summary[sumRange] ?? null;
          const value = item
            ? isVolume
              ? formatCompactCurrency(item.change)
              : formatSignedCurrency(item.change)
            : "N/A";
          const tone = !isVolume && item ? getToneClass(item.change) : "";
          const active = range === sumRange;
          return (
            <button
              key={label}
              type="button"
              className={`range-summary-item ${active ? "is-active" : ""}`}
              onClick={() => handleSummaryRange(sumRange)}
              aria-pressed={active}
            >
              <span className="range-summary-label">{label}</span>
              <span className={`range-summary-value ${tone}`}>{value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}