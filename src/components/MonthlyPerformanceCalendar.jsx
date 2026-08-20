import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { buildDailyPerformance, getCalendarInsights } from "../utils/calendarAnalytics";
import { formatCompactCurrency, formatSignedCurrency } from "../utils/formatters";
import { getToneClass } from "../utils/states";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function getHeatmapClass(pnl, maxMag) {
  if (pnl == null || pnl === 0 || !maxMag) return "cell-neutral";
  const ratio = Math.abs(pnl) / maxMag;
  if (pnl > 0) {
    if (ratio > 0.6) return "cell-pos-strong";
    if (ratio > 0.25) return "cell-pos-med";
    return "cell-pos-light";
  } else {
    if (ratio > 0.6) return "cell-neg-strong";
    if (ratio > 0.25) return "cell-neg-med";
    return "cell-neg-light";
  }
}

export default function MonthlyPerformanceCalendar({ resolvedPositions = [], activity = [], loading }) {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 7, 1));
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "monthly"

  const { byDay, byMonth } = useMemo(() => {
    return buildDailyPerformance(resolvedPositions, activity);
  }, [resolvedPositions, activity]);

  const insights = useMemo(() => {
    return getCalendarInsights(byDay);
  }, [byDay]);

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const monthName = MONTH_NAMES[monthIndex];
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  function handlePrevMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  // Max magnitude in active month for heatmap normalization
  const maxMonthMagnitude = useMemo(() => {
    let max = 0;
    for (const [dayKey, entry] of byDay.entries()) {
      if (dayKey.startsWith(monthKey) && entry && entry.pnl !== 0) {
        const mag = Math.abs(entry.pnl);
        if (mag > max) max = mag;
      }
    }
    return max;
  }, [byDay, monthKey]);

  // Days in month calculation
  const calendarCells = useMemo(() => {
    const firstDayObj = new Date(Date.UTC(year, monthIndex, 1));
    const totalDays = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const startDay = (firstDayObj.getUTCDay() + 6) % 7; // Monday = 0

    const cells = [];
    for (let i = 0; i < startDay; i++) {
      cells.push({ type: "empty", key: `empty-${i}` });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    for (let d = 1; d <= totalDays; d++) {
      const dayStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayData = byDay.get(dayStr) ?? null;
      const isToday = dayStr === todayStr;

      cells.push({
        type: "day",
        key: dayStr,
        dayNumber: d,
        dayStr,
        data: dayData,
        isToday,
      });
    }

    return cells;
  }, [year, monthIndex, byDay]);

  // Selected month statistics
  const currentMonthData = byMonth.get(monthKey) ?? null;
  const monthPnl = currentMonthData?.pnl ?? 0;
  const monthWins = currentMonthData?.wins ?? 0;
  const monthLosses = currentMonthData?.losses ?? 0;
  const monthAvgWin = monthWins > 0 ? currentMonthData.winSum / monthWins : null;
  const monthAvgLoss = monthLosses > 0 ? currentMonthData.lossSum / monthLosses : null;
  const monthVolume = currentMonthData?.volume ?? null;

  return (
    <div className={`card monthly-calendar-card ${loading ? "is-loading" : ""}`}>
      <div className="monthly-calendar-header-top">
        <div className="monthly-calendar-title">
          <Calendar size={15} className="monthly-title-icon" aria-hidden="true" />
          <span>Monthly Performance</span>
        </div>
        {currentMonthData && (
          <span className={`month-badge ${getToneClass(monthPnl)}`}>
            {formatSignedCurrency(monthPnl)} this month
          </span>
        )}
      </div>

      <div className="calendar-insights-strip" role="region" aria-label="Monthly Performance Insights">
        <div className="insight-chip">
          <span className="insight-label">Best Day</span>
          <span className={`insight-value ${insights.bestDayPnL != null ? getToneClass(insights.bestDayPnL) : ""}`}>
            {insights.bestDayPnL != null ? formatSignedCurrency(insights.bestDayPnL) : "N/A"}
          </span>
        </div>

        <div className="insight-divider" aria-hidden="true" />

        <div className="insight-chip">
          <span className="insight-label">Worst Day</span>
          <span className={`insight-value ${insights.worstDayPnL != null ? getToneClass(insights.worstDayPnL) : ""}`}>
            {insights.worstDayPnL != null ? formatSignedCurrency(insights.worstDayPnL) : "N/A"}
          </span>
        </div>

        <div className="insight-divider" aria-hidden="true" />

        <div className="insight-chip">
          <span className="insight-label">Active Days</span>
          <span className="insight-value">{insights.activeDaysCount}</span>
        </div>

        <div className="insight-divider" aria-hidden="true" />

        <div className="insight-chip">
          <span className="insight-label">Winning Days</span>
          <span className="insight-value tone-positive">{insights.winningDaysCount}</span>
        </div>

        <div className="insight-divider" aria-hidden="true" />

        <div className="insight-chip">
          <span className="insight-label">Losing Days</span>
          <span className="insight-value tone-negative">{insights.losingDaysCount}</span>
        </div>
      </div>

      <div className="month-toolbar">
        <div className="month-nav-controls">
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft size={13} aria-hidden="true" />
          </button>
          <span className="month-nav-label">
            {monthName} {year}
          </span>
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight size={13} aria-hidden="true" />
          </button>
        </div>

        <div className="segmented-toggle" role="group" aria-label="Calendar view toggle">
          <button
            type="button"
            className={`segmented-btn ${viewMode === "daily" ? "is-active" : ""}`}
            onClick={() => setViewMode("daily")}
            aria-pressed={viewMode === "daily"}
          >
            Daily
          </button>
          <button
            type="button"
            className={`segmented-btn ${viewMode === "monthly" ? "is-active" : ""}`}
            onClick={() => setViewMode("monthly")}
            aria-pressed={viewMode === "monthly"}
          >
            Monthly
          </button>
        </div>
      </div>

      {viewMode === "daily" ? (
        <div className="calendar-grid-container">
          <div className="calendar-weekday-header">
            {WEEKDAYS.map((w, i) => (
              <span key={`${w}-${i}`} className="calendar-weekday">
                {w}
              </span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarCells.map((cell) => {
              if (cell.type === "empty") {
                return <div key={cell.key} className="calendar-cell cell-empty" />;
              }

              const pnl = cell.data?.pnl ?? null;
              const hasPnl = pnl != null && pnl !== 0;
              const heatmapTone = getHeatmapClass(pnl, maxMonthMagnitude);

              return (
                <div
                  key={cell.key}
                  className={`calendar-cell ${heatmapTone} ${cell.isToday ? "cell-today" : ""}`}
                >
                  <span className="cell-day-num">{cell.dayNumber}</span>
                  <span className={`cell-pnl-val ${hasPnl ? getToneClass(pnl) : ""}`}>
                    {hasPnl ? formatCompactCurrency(pnl) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="monthly-history-list">
          {Array.from(byMonth.entries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([mKey, mData]) => {
              const [y, m] = mKey.split("-");
              const label = `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
              return (
                <div key={mKey} className="monthly-history-row">
                  <span className="monthly-history-label">{label}</span>
                  <span className="monthly-history-trades">{mData.count} resolved trades</span>
                  <span className={`monthly-history-value ${getToneClass(mData.pnl)}`}>
                    {formatSignedCurrency(mData.pnl)}
                  </span>
                </div>
              );
            })}
          {byMonth.size === 0 && (
            <div className="monthly-history-empty">No monthly trade records available</div>
          )}
        </div>
      )}

      <div className="monthly-summary-strip">
        <div className="monthly-summary-item">
          <span className="monthly-summary-label">Monthly Realized PnL</span>
          <span className={`monthly-summary-value ${currentMonthData ? getToneClass(monthPnl) : ""}`}>
            {currentMonthData ? formatSignedCurrency(monthPnl) : "N/A"}
          </span>
        </div>
        <div className="monthly-summary-item">
          <span className="monthly-summary-label">Winning Positions</span>
          <span className="monthly-summary-value tone-positive">{currentMonthData ? monthWins : "N/A"}</span>
        </div>
        <div className="monthly-summary-item">
          <span className="monthly-summary-label">Losing Positions</span>
          <span className="monthly-summary-value tone-negative">{currentMonthData ? monthLosses : "N/A"}</span>
        </div>
        <div className="monthly-summary-item">
          <span className="monthly-summary-label">Average Win</span>
          <span className={`monthly-summary-value ${monthAvgWin != null ? "tone-positive" : ""}`}>
            {monthAvgWin != null ? formatSignedCurrency(monthAvgWin) : "N/A"}
          </span>
        </div>
        <div className="monthly-summary-item">
          <span className="monthly-summary-label">Average Loss</span>
          <span className={`monthly-summary-value ${monthAvgLoss != null ? "tone-negative" : ""}`}>
            {monthAvgLoss != null ? formatSignedCurrency(monthAvgLoss) : "N/A"}
          </span>
        </div>
        <div className="monthly-summary-item">
          <span className="monthly-summary-label">Trading Volume</span>
          <span className="monthly-summary-value">
            {monthVolume != null ? formatCompactCurrency(monthVolume) : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
