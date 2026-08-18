import { ActivityTypeBadge } from "./ActivityRow";
import { formatCurrency, formatPrice, formatTimeAgo } from "../utils/formatters";

export default function ActivityCardMobile({ activity }) {
  return (
    <div className="activity-card-mobile">
      <div className="activity-card-mobile-top">
        <ActivityTypeBadge type={activity.type} />
        <span className="activity-card-time">{formatTimeAgo(activity.timestamp)}</span>
      </div>
      <span className="market-title">{activity.market}</span>
      <div className="activity-card-mobile-meta">
        <span className={`side-badge side-${activity.side.toLowerCase()}`}>{activity.side}</span>
        <span className="text-muted">{formatCurrency(activity.amount)}</span>
        <span className="text-muted">at {formatPrice(activity.price)}</span>
      </div>
    </div>
  );
}
