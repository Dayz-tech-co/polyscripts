import { BarChart3, CircleDollarSign, Layers3, Percent, TrendingUp, Wallet } from "lucide-react";
import StatCard from "./StatCard";
import { StatsSkeleton } from "./Skeleton";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercentage, formatSignedCurrency } from "../utils/formatters";
import { getValueState } from "../utils/states";

export default function ProfileStats({ stats, loading }) {
  if (loading || !stats) return <StatsSkeleton />;

  return (
    <div className="stats-grid stats-grid-six">
      <StatCard
        icon={TrendingUp}
        label="Profit / Loss"
        value={stats.pnl != null ? formatSignedCurrency(stats.pnl) : "--"}
        sub={stats.pnlPercent != null ? formatPercentage(stats.pnlPercent, { signed: true }) : undefined}
        subTone={getValueState(stats.pnlPercent)}
      />
      <StatCard
        icon={BarChart3}
        label="Trading Volume"
        value={stats.volume != null ? formatCompactCurrency(stats.volume) : "--"}
      />
      <StatCard
        icon={Wallet}
        label="Portfolio Value"
        value={stats.portfolioValue != null ? formatCurrency(stats.portfolioValue) : "--"}
      />
      <StatCard
        icon={Layers3}
        label="Markets"
        value={stats.marketsTraded != null ? formatNumber(stats.marketsTraded) : "--"}
      />
      <StatCard
        icon={Percent}
        label="Win Rate"
        value={stats.winRate != null ? formatPercentage(stats.winRate) : "--"}
      />
      <StatCard
        icon={CircleDollarSign}
        label="Open Positions"
        value={stats.openPositionsCount != null ? formatNumber(stats.openPositionsCount) : "--"}
        sub={stats.rank != null ? `Rank #${formatNumber(stats.rank)}` : undefined}
        subTone="neutral"
      />
    </div>
  );
}