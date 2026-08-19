import { ActivityTypeBadge } from "./ActivityRow";
import MarketImage from "./MarketImage";
import { formatCurrency, formatPrice, formatTimeAgo } from "../utils/formatters";

export default function ActivityCardMobile({ activity }) {
  return (
    <div className="activity-card-mobile">
      <div className="activity-card-mobile-top">
        <ActivityTypeBadge type={activity.type} />
        <span className="activity-card-time">{formatTimeAgo(activity.timestamp)}</span>
      </div>
      <div className="activity-card-mobile-market">
        <MarketImage icon={activity.icon} category={activity.category} tag={activity.tag} size={36} />
        <span className="market-title">{activity.market}</span>
      </div>
      <div className="activity-card-mobile-meta">
        <span className={`side-badge side-${activity.side.toLowerCase()}`}>{activity.side}</span>
        <span className="text-muted">{formatCurrency(activity.amount)}</span>
        <span className="text-muted">at {formatPrice(activity.price)}</span>
      </div>
    </div>
  );
}
