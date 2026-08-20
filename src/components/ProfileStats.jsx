import { BarChart3, CircleDollarSign, Layers3, Percent, TrendingUp, Wallet } from "lucide-react";
import { StatsSkeleton } from "./Skeleton";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercentage, formatSignedCurrency } from "../utils/formatters";
import { getValueState } from "../utils/states";

export default function ProfileStats({ stats, loading }) {
  if (loading || !stats) return <StatsSkeleton />;

  const pnlTone = getValueState(stats.pnl);

  return (
    <div className="profile-stats-strip">
      <div className="stat-card stat-card-hero">
        <div className="stat-card-header">
          <span className="stat-card-label">Profit / Loss</span>
          <TrendingUp size={14} className="stat-card-icon" aria-hidden="true" />
        </div>
        <div className={`stat-card-value ${pnlTone}`}>
          {stats.pnl != null ? formatSignedCurrency(stats.pnl) : "--"}
        </div>
        {stats.pnlPercent != null && (
          <div className={`stat-card-sub ${getValueState(stats.pnlPercent)}`}>
            {formatPercentage(stats.pnlPercent, { signed: true })}
          </div>
        )}
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-label">Trading Volume</span>
          <BarChart3 size={13} className="stat-card-icon" aria-hidden="true" />
        </div>
        <div className="stat-card-value">
          {stats.volume != null ? formatCompactCurrency(stats.volume) : "--"}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-label">Portfolio Value</span>
          <Wallet size={13} className="stat-card-icon" aria-hidden="true" />
        </div>
        <div className="stat-card-value">
          {stats.portfolioValue != null ? formatCurrency(stats.portfolioValue) : "--"}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-label">Markets Traded</span>
          <Layers3 size={13} className="stat-card-icon" aria-hidden="true" />
        </div>
        <div className="stat-card-value">
          {stats.marketsTraded != null ? formatNumber(stats.marketsTraded) : "--"}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-label">Win Rate</span>
          <Percent size={13} className="stat-card-icon" aria-hidden="true" />
        </div>
        <div className="stat-card-value">
          {stats.winRate != null ? formatPercentage(stats.winRate) : "--"}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-label">Open Positions</span>
          <CircleDollarSign size={13} className="stat-card-icon" aria-hidden="true" />
        </div>
        <div className="stat-card-value">
          {stats.openPositionsCount != null ? formatNumber(stats.openPositionsCount) : "--"}
        </div>
        {stats.rank != null && (
          <div className="stat-card-sub text-muted">
            Rank #{formatNumber(stats.rank)}
          </div>
        )}
      </div>
    </div>
  );
}