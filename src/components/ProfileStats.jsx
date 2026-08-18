import { BarChart3, CircleDollarSign, Layers3, TrendingUp } from "lucide-react";
import StatCard from "./StatCard";
import { StatsSkeleton } from "./Skeleton";
import { formatCompactCurrency, formatCurrency, formatPercentage, formatSignedCurrency } from "../utils/formatters";

export default function ProfileStats({ stats, loading }) {
  if (loading || !stats) return <StatsSkeleton />;

  const pnlPositive = stats.pnl >= 0;

  return (
    <div className="stats-grid">
      <StatCard
        icon={CircleDollarSign}
        label="Portfolio Value"
        value={formatCurrency(stats.portfolioValue)}
      />
      <StatCard
        icon={TrendingUp}
        label="Profit / Loss"
        value={formatSignedCurrency(stats.pnl)}
        sub={formatPercentage(stats.pnlPercent, { signed: true })}
        subTone={pnlPositive ? "positive" : "negative"}
      />
      <StatCard
        icon={BarChart3}
        label="Trading Volume"
        value={formatCompactCurrency(stats.volume)}
      />
      <StatCard
        icon={Layers3}
        label="Markets Traded"
        value={stats.marketsTraded}
        sub={`${formatPercentage(stats.winRate)} win rate`}
        subTone="neutral"
      />
    </div>
  );
}
