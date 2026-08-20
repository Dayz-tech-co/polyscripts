import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, DollarSign, Percent } from "lucide-react";
import Tooltip from "./Tooltip";
import { buildDailyPerformance } from "../utils/calendarAnalytics";
import { formatCompactCurrency, formatSignedCurrency } from "../utils/formatters";
import { getToneClass } from "../utils/states";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function MonthlyPerformanceCalendar({ resolvedPositions = [], activity = [], loading }) {
  // Default to August 2026 (current active month) or local date
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 7, 1));
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "monthly"

  const { byDay, byMonth } = useMemo(() => {
    return buildDailyPerformance(resolvedPositions, activity);
  }, [resolvedPositions, activity]);

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

  // Days in month calculation
  const calendarCells = useMemo(() => {
    const firstDayObj = new Date(Date.UTC(year, monthIndex, 1));
    const totalDays = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    // Monday is index 0
    const startDay = (firstDayObj.getUTCDay() + 6) % 7;

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
      <div className="monthly-calendar-header">
        <div className="monthly-calendar-title">
          <Calendar size={16} className="monthly-title-icon" aria-hidden="true" />
          <span>Monthly Performance</span>
        </div>

        <div className="month-nav-controls">
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft size={14} aria-hidden="true" />
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
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="monthly-controls">
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

          <div className="segmented-toggle" role="group" aria-label="Unit toggle">
            <button type="button" className="segmented-btn is-active" aria-pressed="true">
              <DollarSign size={12} aria-hidden="true" />
            </button>
            <Tooltip label="Percentage change requires base capital denominator (unavailable)">
              <button type="button" className="segmented-btn is-disabled" disabled aria-pressed="false">
                <Percent size={12} aria-hidden="true" />
              </button>
            </Tooltip>
          </div>
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
              const isPositive = hasPnl && pnl > 0;
              const isNegative = hasPnl && pnl < 0;

              let toneClass = "cell-neutral";
              if (isPositive) toneClass = "cell-positive";
              if (isNegative) toneClass = "cell-negative";

              return (
                <div
                  key={cell.key}
                  className={`calendar-cell ${toneClass} ${cell.isToday ? "cell-today" : ""}`}
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
            {currentMonthData ? formatSignedCurrency(monthPnl) : "--"}
          </span>
        </div>
        <div className="monthly-summary-item">
          <span className="monthly-summary-label">Resolved Wins</span>
          <span className="monthly-summary-value text-positive">{currentMonthData ? monthWins : "--"}</span>
        </div>
        <div className="monthly-summary-item">
          <span className="monthly-summary-label">Resolved Losses</span>
          <span className="monthly-summary-value text-negative">{currentMonthData ? monthLosses : "--"}</span>
        </div>
        <div className="monthly-summary-item">
          <span className="monthly-summary-label">Average Win</span>
          <span className="monthly-summary-value text-positive">
            {monthAvgWin != null ? formatSignedCurrency(monthAvgWin) : "--"}
          </span>
        </div>
        <div className="monthly-summary-item">
          <span className="monthly-summary-label">Average Loss</span>
          <span className="monthly-summary-value text-negative">
            {monthAvgLoss != null ? formatSignedCurrency(monthAvgLoss) : "--"}
          </span>
        </div>
        <div className="monthly-summary-item">
          <span className="monthly-summary-label">Trading Volume</span>
          <span className="monthly-summary-value">
            {monthVolume != null ? formatCompactCurrency(monthVolume) : "--"}
          </span>
        </div>
      </div>
    </div>
  );
}
