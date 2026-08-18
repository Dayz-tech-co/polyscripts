import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import Filters from "./Filters";
import ActivityRow from "./ActivityRow";
import ActivityCardMobile from "./ActivityCardMobile";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";

const TYPE_FILTERS = ["All", "Buy", "Sell", "Other"];

function matchesFilter(activity, filter) {
  if (filter === "All") return true;
  if (filter === "Buy") return activity.type === "Bought";
  if (filter === "Sell") return activity.type === "Sold";
  if (filter === "Other") return activity.type !== "Bought" && activity.type !== "Sold";
  return true;
}

export default function ActivitySection({ activity, loading, limit }) {
  const [filter, setFilter] = useState("All");

  const visible = useMemo(() => {
    let list = (activity || []).filter((item) => matchesFilter(item, filter));
    return limit ? list.slice(0, limit) : list;
  }, [activity, filter, limit]);

  return (
    <section className="section" aria-labelledby="recent-activity-heading">
      <div className="section-header">
        <h2 className="section-title" id="recent-activity-heading">
          Recent Activity
        </h2>
        <div className="section-actions">
          <Filters options={TYPE_FILTERS} active={filter} onChange={setFilter} ariaLabel="Filter activity" />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Activity} title="No activity found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Amount</th>
                  <th>Price</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <ActivityRow key={item.id} activity={item} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="activity-mobile-list">
            {visible.map((item) => (
              <ActivityCardMobile key={item.id} activity={item} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
