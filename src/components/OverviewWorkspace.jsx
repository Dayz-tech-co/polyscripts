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
        {loading ? (
          <span className="workspace-live">
            <i />
            Syncing history
          </span>
        ) : null}
      </div>

      <div className="workspace-body">
        {view === "calendar" &&
          (!calendarReady ? (
            <div className="workspace-loading">
              <PageLoader compact label="Loading calendar" detail="Official daily PnL history" />
            </div>
          ) : (
            <MonthlyPerformanceCalendar
              resolvedPositions={resolvedPositions}
              activity={activity}
              performanceSeries={performanceSeries}
              loading={loading}
            />
          ))}

        {view === "chart" &&
          (identifier ? (
            <PerformanceCard
              key={`chart-${identifier}`}
              identifier={identifier}
              stats={stats}
              seedSeries={performanceSeries}
            />
          ) : (
            <div className="workspace-loading">
              <PageLoader compact label="Preparing chart" detail="Waiting for account" />
            </div>
          ))}

        {view === "matrix" && <MarketExposure positions={positions} loading={loading} />}
      </div>
    </section>
  );
}
