import { BarChart3, Layers3, Percent, TrendingUp, Wallet, CircleDot } from "lucide-react";
import { StatsSkeleton } from "./Skeleton";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercentage, formatSignedCurrency } from "../utils/formatters";
import { getToneClass, getValueState } from "../utils/states";

const ICON = { size: 15, strokeWidth: 1.75 };

/**
 * Hierarchical account KPI — flat Polymarket-mature layout.
 * Hero P/L (left accent), featured Portfolio + Volume, secondary chips.
 */
export default function ProfileStats({ stats, loading }) {
  if (loading || !stats) return <StatsSkeleton />;

  const pnlTone = getValueState(stats.pnl);
  const pnlClass = getToneClass(stats.pnl);

  return (
    <section className="account-kpi" role="region" aria-label="Account overview">
      <div className={`account-kpi-hero tone-${pnlTone}`}>
        <div className="account-kpi-hero-top">
          <span className="account-kpi-eyebrow">
            <TrendingUp {...ICON} aria-hidden="true" />
            Total profit / loss
          </span>
          {stats.rank != null && (
            <span className="account-kpi-rank">Rank #{formatNumber(stats.rank)}</span>
          )}
        </div>
        <p className={`account-kpi-hero-value ${pnlClass}`}>
          {stats.pnl != null ? formatSignedCurrency(stats.pnl) : "N/A"}
        </p>
        <p className="account-kpi-hero-hint">Realized + unrealized · this account</p>
      </div>

      <div className="account-kpi-featured">
        <article className="account-kpi-card account-kpi-card-feature">
          <div className="account-kpi-card-icon" aria-hidden="true">
            <Wallet {...ICON} />
          </div>
          <div className="account-kpi-card-body">
            <span className="account-kpi-card-label">Portfolio value</span>
            <span className="account-kpi-card-value">
              {stats.portfolioValue != null ? formatCurrency(stats.portfolioValue) : "N/A"}
            </span>
            {stats.cashBalance != null && stats.cashBalance > 0 && (
              <span className="account-kpi-card-meta">
                Incl. {formatCompactCurrency(stats.cashBalance)} cash
              </span>
            )}
          </div>
        </article>

        <article className="account-kpi-card account-kpi-card-feature">
          <div className="account-kpi-card-icon" aria-hidden="true">
            <BarChart3 {...ICON} />
          </div>
          <div className="account-kpi-card-body">
            <span className="account-kpi-card-label">Trading volume</span>
            <span className="account-kpi-card-value">
              {stats.volume != null ? formatCompactCurrency(stats.volume) : "N/A"}
            </span>
            <span className="account-kpi-card-meta">All-time notional</span>
          </div>
        </article>
      </div>

      <div className="account-kpi-secondary">
        <div className="account-kpi-chip">
          <Layers3 {...ICON} className="account-kpi-chip-icon" aria-hidden="true" />
          <div>
            <span className="account-kpi-chip-label">Markets traded</span>
            <span className="account-kpi-chip-value">
              {stats.marketsTraded != null ? formatNumber(stats.marketsTraded) : "N/A"}
            </span>
          </div>
        </div>
        <div className="account-kpi-chip">
          <Percent {...ICON} className="account-kpi-chip-icon" aria-hidden="true" />
          <div>
            <span className="account-kpi-chip-label">Win rate</span>
            <span className="account-kpi-chip-value">
              {stats.winRate != null ? formatPercentage(stats.winRate) : "N/A"}
            </span>
          </div>
        </div>
        <div className="account-kpi-chip">
          <CircleDot {...ICON} className="account-kpi-chip-icon" aria-hidden="true" />
          <div>
            <span className="account-kpi-chip-label">Open positions</span>
            <span className="account-kpi-chip-value">
              {stats.openPositionsCount != null ? formatNumber(stats.openPositionsCount) : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
