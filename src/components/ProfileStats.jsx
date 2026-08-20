import { BarChart3, CircleDollarSign, Layers3, Percent, TrendingUp, Wallet } from "lucide-react";
import { StatsSkeleton } from "./Skeleton";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercentage, formatSignedCurrency } from "../utils/formatters";
import { getValueState } from "../utils/states";

export default function ProfileStats({ stats, loading }) {
  if (loading || !stats) return <StatsSkeleton />;

  const pnlTone = getValueState(stats.pnl);

  return (
    <div className="kpi-integrated-strip" role="region" aria-label="Account Overview Statistics">
      <div className="kpi-group kpi-group-hero">
        <div className="kpi-header">
          <span className="kpi-label">Profit / Loss</span>
          <TrendingUp size={12} className="kpi-icon" aria-hidden="true" />
        </div>
        <div className={`kpi-value kpi-value-hero ${pnlTone}`}>
          {stats.pnl != null ? formatSignedCurrency(stats.pnl) : "--"}
        </div>
      </div>

      <div className="kpi-divider" aria-hidden="true" />

      <div className="kpi-group">
        <div className="kpi-header">
          <span className="kpi-label">Trading Volume</span>
          <BarChart3 size={12} className="kpi-icon" aria-hidden="true" />
        </div>
        <div className="kpi-value">
          {stats.volume != null ? formatCompactCurrency(stats.volume) : "--"}
        </div>
      </div>

      <div className="kpi-divider" aria-hidden="true" />

      <div className="kpi-group">
        <div className="kpi-header">
          <span className="kpi-label">Portfolio Value</span>
          <Wallet size={12} className="kpi-icon" aria-hidden="true" />
        </div>
        <div className="kpi-value">
          {stats.portfolioValue != null ? formatCurrency(stats.portfolioValue) : "--"}
        </div>
      </div>

      <div className="kpi-divider" aria-hidden="true" />

      <div className="kpi-group">
        <div className="kpi-header">
          <span className="kpi-label">Markets Traded</span>
          <Layers3 size={12} className="kpi-icon" aria-hidden="true" />
        </div>
        <div className="kpi-value">
          {stats.marketsTraded != null ? formatNumber(stats.marketsTraded) : "--"}
        </div>
      </div>

      <div className="kpi-divider" aria-hidden="true" />

      <div className="kpi-group">
        <div className="kpi-header">
          <span className="kpi-label">Win Rate</span>
          <Percent size={12} className="kpi-icon" aria-hidden="true" />
        </div>
        <div className="kpi-value">
          {stats.winRate != null ? formatPercentage(stats.winRate) : "--"}
        </div>
      </div>

      <div className="kpi-divider" aria-hidden="true" />

      <div className="kpi-group">
        <div className="kpi-header">
          <span className="kpi-label">Open Positions</span>
          <CircleDollarSign size={12} className="kpi-icon" aria-hidden="true" />
        </div>
        <div className="kpi-value">
          {stats.openPositionsCount != null ? formatNumber(stats.openPositionsCount) : "--"}
        </div>
        {stats.rank != null && (
          <div className="kpi-subtext">
            Rank #{formatNumber(stats.rank)}
          </div>
        )}
      </div>
    </div>
  );
}