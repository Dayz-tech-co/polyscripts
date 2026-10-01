import { ArrowDownLeft, ArrowDownRight, ArrowUpRight, CircleDollarSign, Gift } from "lucide-react";
import MarketImage from "./MarketImage";
import { formatCurrency, formatPrice, formatTimeAgo } from "../utils/formatters";

const TYPE_ICON = {
  Bought: ArrowUpRight,
  Sold: ArrowDownRight,
  Redeemed: CircleDollarSign,
  Deposit: ArrowDownLeft,
  Withdrawal: ArrowUpRight,
  "Referral reward": Gift,
  Reward: Gift,
};

function sideClass(side) {
  if (!side || side === "-") return null;
  return `side-${String(side).toLowerCase().replace(/\s+/g, "-")}`;
}

export function ActivityTypeBadge({ type }) {
  const Icon = TYPE_ICON[type] || CircleDollarSign;
  const slug = String(type || "activity")
    .toLowerCase()
    .replace(/\s+/g, "-");
  return (
    <span className={`activity-type activity-type-${slug}`}>
      <Icon size={13} aria-hidden="true" />
      {type}
    </span>
  );
}

export default function ActivityRow({ activity }) {
  const sideCls = sideClass(activity.side);
  const tag = activity.tag || (activity.market ? activity.market.slice(0, 3).toUpperCase() : "ACT");
  return (
    <tr className="activity-row">
      <td>
        <ActivityTypeBadge type={activity.type} />
      </td>
      <td>
        <div className="market-cell">
          <MarketImage icon={activity.icon} category={activity.category} tag={tag} size={34} radius={8} />
          <span className="market-title" title={activity.market}>
            {activity.market}
          </span>
        </div>
      </td>
      <td>
        {sideCls ? (
          <span className={`side-badge ${sideCls}`}>{activity.side}</span>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td className="num-cell">{formatCurrency(activity.amount)}</td>
      <td className="num-cell">{activity.price != null ? formatPrice(activity.price) : "-"}</td>
      <td className="num-cell text-muted">{formatTimeAgo(activity.timestamp)}</td>
    </tr>
  );
}
