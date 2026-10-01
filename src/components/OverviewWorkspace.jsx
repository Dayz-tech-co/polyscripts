import { useEffect, useState } from "react";
import { CalendarDays, ChartLine, Grid2x2 } from "lucide-react";
import MonthlyPerformanceCalendar from "./MonthlyPerformanceCalendar";
import PerformanceCard from "./PerformanceCard";
import MarketExposure from "./MarketExposure";
import SegmentControl from "./SegmentControl";
import PageLoader from "./PageLoader";

const VIEWS = [
  { value: "calendar", label: "Calendar", icon: CalendarDays },
  { value: "chart", label: "PnL chart", icon: ChartLine },
  { value: "matrix", label: "Matrix", icon: Grid2x2 },
];

export default function OverviewWorkspace({
  identifier,
  stats,
  resolvedPositions,
  activity,
  performanceSeries,
  positions,
  loading,
  defaultView = "calendar",
}) {
  const [view, setView] = useState(defaultView);

  useEffect(() => {
    setView(defaultView);
  }, [defaultView, identifier]);

  const calendarReady = Boolean(performanceSeries?.length) || !loading;

  return (
    <section className="overview-workspace" aria-label="Analysis workspace">
      <div className="workspace-toolbar">
        <SegmentControl
          options={VIEWS}
          value={view}
          onChange={setView}
          ariaLabel="Workspace views"
          size="md"
          variant="underline"
        />
        {loading ? <span className="workspace-live"><i />Syncing history</span> : null}
      </div>

      <div className="workspace-body">
        {!calendarReady && view === "calendar" ? (
          <div className="workspace-loading">
            <PageLoader compact label="Loading calendar" detail="Official daily PnL history" />
          </div>
        ) : (
          <div className={`workspace-pane ${view === "calendar" ? "is-active" : ""}`} hidden={view !== "calendar"}>
            <MonthlyPerformanceCalendar
              resolvedPositions={resolvedPositions}
              activity={activity}
              performanceSeries={performanceSeries}
              loading={loading}
            />
          </div>
        )}

        {/* Keep chart mounted so range data is warm when switching */}
        <div className={`workspace-pane ${view === "chart" ? "is-active" : ""}`} hidden={view !== "chart"}>
          {identifier ? (
            <PerformanceCard identifier={identifier} stats={stats} />
          ) : (
            <div className="workspace-loading">
              <PageLoader compact label="Preparing chart" detail="Waiting for account" />
            </div>
          )}
        </div>

        <div className={`workspace-pane ${view === "matrix" ? "is-active" : ""}`} hidden={view !== "matrix"}>
          <MarketExposure positions={positions} loading={loading} />
        </div>
      </div>
    </section>
  );
}
