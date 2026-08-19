import { ArrowDownRight, ArrowUpRight, CircleDollarSign } from "lucide-react";
import MarketImage from "./MarketImage";
import { formatCurrency, formatPrice, formatTimeAgo } from "../utils/formatters";

const TYPE_ICON = {
  Bought: ArrowUpRight,
  Sold: ArrowDownRight,
  Redeemed: CircleDollarSign,
};

export function ActivityTypeBadge({ type }) {
  const Icon = TYPE_ICON[type] || CircleDollarSign;
  return (
    <span className={`activity-type activity-type-${type.toLowerCase()}`}>
      <Icon size={13} aria-hidden="true" />
      {type}
    </span>
  );
}

export default function ActivityRow({ activity }) {
  return (
    <tr className="activity-row">
      <td>
        <ActivityTypeBadge type={activity.type} />
      </td>
      <td className="market-cell">
        <MarketImage icon={activity.icon} category={activity.category} tag={activity.tag} size={36} />
        <span className="market-title" title={activity.market}>
          {activity.market}
        </span>
      </td>
      <td>
        <span className={`side-badge side-${activity.side.toLowerCase()}`}>{activity.side}</span>
      </td>
      <td className="num-cell">{formatCurrency(activity.amount)}</td>
      <td className="num-cell">{formatPrice(activity.price)}</td>
      <td className="num-cell text-muted">{formatTimeAgo(activity.timestamp)}</td>
    </tr>
  );
}
