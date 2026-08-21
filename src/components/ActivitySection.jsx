import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import Filters from "./Filters";
import ActivityRow from "./ActivityRow";
import ActivityCardMobile from "./ActivityCardMobile";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";

const TYPE_FILTERS = ["All", "Buy", "Sell", "Deposit", "Withdrawal", "Rewards", "Other"];

const TRADE_TYPES = new Set(["Bought", "Sold"]);
const DEPOSIT_TYPES = new Set(["Deposit", "Deposited"]);
const WITHDRAWAL_TYPES = new Set(["Withdrawal", "Withdrew"]);
const REWARD_TYPES = new Set([
  "Reward",
  "Referral reward",
  "Maker rebate",
  "Taker rebate",
  "Yield",
]);
const REWARD_RAW = new Set(["REWARD", "REFERRAL_REWARD", "MAKER_REBATE", "TAKER_REBATE", "YIELD"]);

function matchesFilter(activity, filter) {
  if (filter === "All") return true;
  if (filter === "Buy") return activity.type === "Bought";
  if (filter === "Sell") return activity.type === "Sold";
  if (filter === "Deposit") return DEPOSIT_TYPES.has(activity.type) || activity.rawType === "DEPOSIT";
  if (filter === "Withdrawal") return WITHDRAWAL_TYPES.has(activity.type) || activity.rawType === "WITHDRAWAL";
  if (filter === "Rewards") return REWARD_TYPES.has(activity.type) || REWARD_RAW.has(activity.rawType);
  if (filter === "Other") {
    return (
      !TRADE_TYPES.has(activity.type) &&
      !DEPOSIT_TYPES.has(activity.type) &&
      !WITHDRAWAL_TYPES.has(activity.type) &&
      !REWARD_TYPES.has(activity.type) &&
      activity.rawType !== "DEPOSIT" &&
      activity.rawType !== "WITHDRAWAL" &&
      !REWARD_RAW.has(activity.rawType)
    );
  }
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
                {visible.map((item, index) => (
                  <ActivityRow key={`${item.id}-${index}`} activity={item} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="activity-mobile-list">
            {visible.map((item, index) => (
              <ActivityCardMobile key={`${item.id}-${index}`} activity={item} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
