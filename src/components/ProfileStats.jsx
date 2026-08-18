import { BarChart3, CircleDollarSign, Layers3, TrendingUp } from "lucide-react";
import StatCard from "./StatCard";
import { StatsSkeleton } from "./Skeleton";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercentage, formatSignedCurrency } from "../utils/formatters";

export default function ProfileStats({ stats, loading }) {
  if (loading || !stats) return <StatsSkeleton />;

  const pnlPositive = (stats.pnl ?? 0) >= 0;

  return (
    <div className="stats-grid">
      <StatCard
        icon={CircleDollarSign}
        label="Position Value"
        value={stats.portfolioValue != null ? formatCurrency(stats.portfolioValue) : "--"}
      />
      <StatCard
        icon={TrendingUp}
        label="Profit / Loss"
        value={stats.pnl != null ? formatSignedCurrency(stats.pnl) : "--"}
        sub={stats.pnlPercent != null ? formatPercentage(stats.pnlPercent, { signed: true }) : undefined}
        subTone={pnlPositive ? "positive" : "negative"}
      />
      <StatCard
        icon={BarChart3}
        label="Trading Volume"
        value={stats.volume != null ? formatCompactCurrency(stats.volume) : "--"}
      />
      <StatCard
        icon={Layers3}
        label="Markets Traded"
        value={stats.marketsTraded != null ? formatNumber(stats.marketsTraded) : "--"}
        sub={stats.winRate != null ? `${formatPercentage(stats.winRate)} win rate` : undefined}
        subTone="neutral"
      />
    </div>
  );
}
