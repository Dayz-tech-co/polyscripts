import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, RotateCcw } from "lucide-react";
import PerformanceChart from "./PerformanceChart";
import AnimatedNumber from "./AnimatedNumber";
import SegmentControl from "./SegmentControl";
import Tooltip from "./Tooltip";
import { ChartSkeleton } from "./Skeleton";
import { usePerformanceRange } from "../hooks/usePerformanceRange";
import { getPerformanceRange } from "../services/profileService";
import { formatCompactCurrency, formatPercentage, formatSignedCurrency } from "../utils/formatters";
import { getToneClass } from "../utils/states";

const RANGES = ["1D", "1W", "1M", "3M", "ALL"];
const RANGE_LABELS = { "1D": "Last 24 hours", "1W": "Last 7 days", "1M": "Last 30 days", "3M": "Last 90 days", ALL: "All time" };

const SUMMARY_RANGES = [
  { label: "1D", range: "1D" },
  { label: "7D", range: "1W" },
  { label: "30D", range: "1M" },
  { label: "90D", range: "3M" },
  { label: "All time", range: "ALL" },
];

const METRIC_OPTIONS = [
  { value: "performance", label: "Performance" },
  { value: "volume", label: "Volume" },
];

const RANGE_OPTIONS = RANGES.map((r) => ({ value: r, label: r === "ALL" ? "All" : r }));

function buildSeedPayload(seedSeries, range, metric) {
  if (metric !== "performance" || range !== "ALL") return null;
  if (!Array.isArray(seedSeries) || seedSeries.length < 2) return null;
  const points = seedSeries
    .filter((p) => p && p.date && Number.isFinite(p.value))
    .map((p) => ({ date: p.date, value: p.value }));
  if (points.length < 2) return null;
  const startValue = points[0].value;
  const endValue = points[points.length - 1].value;
  return {
    points,
    total: endValue,
    change: endValue,
    changePct: null,
    startValue: 0,
    endValue,
    metric: "performance",
    range: "ALL",
    source: "seed",
  };
}

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

export default function PerformanceCard({ identifier, stats, seedSeries }) {
  const [range, setRange] = useState("ALL");
  const [metric, setMetric] = useState("performance");
  const [resetKey, setResetKey] = useState(0);

  const { status, data } = usePerformanceRange(identifier, range, metric);
  const { loading: summaryLoading, data: summary } = useRangeSummary(identifier, metric);

  const seedPerf = useMemo(() => buildSeedPayload(seedSeries, range, metric), [seedSeries, range, metric]);

  const hasIdentifier = Boolean(identifier);
  const livePerf = status === "ready" && data && data.metric === metric && data.range === range ? data : null;
  const perf = livePerf || seedPerf;
  const loading = !perf && (status === "loading" || !hasIdentifier);
  const hasChart = Boolean(perf && perf.points && perf.points.length > 1);
  const isVolume = metric === "volume";
  const headlineTone = isVolume || !perf ? "" : getToneClass(perf.change);

  function handleMetric(next) {
    if (next === metric) return;
    setMetric(next);
  }

  function handleSummaryRange(targetRange) {
    setRange(targetRange);
  }

  function handleResetView() {
    setResetKey((k) => k + 1);
  }

  return (
    <div className={`card performance-card ${loading ? "is-loading" : ""}`}>
      <div className="performance-header">
        <div className="performance-header-main">
          <div className="performance-title-row">
            <span className="card-label">Performance</span>
            <span className="performance-value-suffix">
              {isVolume ? "Trading volume (loaded activity)" : "Settled profit / loss"} · {RANGE_LABELS[range]}
            </span>
          </div>
          <div className="performance-value-row">
            <span className={`performance-value ${headlineTone}`}>
              {perf ? (
                <AnimatedNumber
                  value={perf.change}
                  format={isVolume ? formatCompactCurrency : formatSignedCurrency}
                />
              ) : loading ? (
                <span className="stat-pulse" style={{ width: 140, height: 32, display: "inline-block" }} />
              ) : (
                "N/A"
              )}
            </span>
          </div>
          {stats && (
            <div className="performance-secondary-strip">
              {stats.portfolioValue != null && (
                <div className="sec-stat-col">
                  <span className="sec-stat-label">Portfolio</span>
                  <span className="sec-stat-val">{formatCompactCurrency(stats.portfolioValue)}</span>
                </div>
              )}
              {stats.volume != null && (
                <div className="sec-stat-col">
                  <span className="sec-stat-label">Volume</span>
                  <span className="sec-stat-val">{formatCompactCurrency(stats.volume)}</span>
                </div>
              )}
              {stats.winRate != null && (
                <div className="sec-stat-col">
                  <span className="sec-stat-label">Win Rate</span>
                  <span className="sec-stat-val">{formatPercentage(stats.winRate)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="performance-controls-row">
          <SegmentControl
            options={METRIC_OPTIONS}
            value={metric}
            onChange={handleMetric}
            ariaLabel="Chart metric"
            size="sm"
          />
          <SegmentControl
            options={RANGE_OPTIONS}
            value={range}
            onChange={setRange}
            ariaLabel="Performance time range"
            size="sm"
          />
          <Tooltip label="Reset chart view">
            <button
              type="button"
              className="icon-btn icon-btn-sm reset-view-btn"
              onClick={handleResetView}
              aria-label="Reset chart zoom & pan view"
            >
              <RotateCcw size={12} aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="chart-area chart-area-hero">
        {!hasIdentifier ? (
          <ChartSkeleton />
        ) : hasChart ? (
          <>
            <PerformanceChart
              key={`${resetKey}-${perf.source || "live"}-${range}-${metric}-${perf.points.length}`}
              data={perf.points}
              metric={metric}
              range={range}
              startValue={perf.startValue ?? 0}
            />
            {status === "loading" && livePerf == null && (
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

      {!isVolume && (
        <p className="performance-scope-note">
          Polymarket&apos;s settled PnL history. Live gains or losses on open positions are added in the Total profit / loss above.
        </p>
      )}

      <div className={`timeframe-shared-strip ${summaryLoading ? "is-loading" : ""}`} role="group" aria-label="Timeframe result cells">
        {SUMMARY_RANGES.map(({ label, range: sumRange }, idx) => {
          const item = summary[sumRange] ?? null;
          const value = item
            ? isVolume
              ? formatCompactCurrency(item.change)
              : formatSignedCurrency(item.change)
            : "N/A";
          const tone = !isVolume && item ? getToneClass(item.change) : "";
          const active = range === sumRange;
          return (
            <div key={label} className="timeframe-cell-wrap">
              {idx > 0 && <div className="timeframe-cell-divider" aria-hidden="true" />}
              <button
                type="button"
                className={`timeframe-cell-btn ${active ? "is-active" : ""}`}
                onClick={() => handleSummaryRange(sumRange)}
                aria-pressed={active}
              >
                <span className="timeframe-cell-label">{label}</span>
                <span className={`timeframe-cell-value ${tone}`}>{value}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
