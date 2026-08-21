import { BarChart3, CircleDot, Layers3, LoaderCircle, Percent, TrendingUp, Wallet } from "lucide-react";
import { StatsSkeleton } from "./Skeleton";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercentage, formatSignedCurrency } from "../utils/formatters";
import { getToneClass, getValueState } from "../utils/states";

const ICON = { size: 15, strokeWidth: 1.75 };

/**
 * Hierarchical account KPI - flat Polymarket-mature layout.
 * Hero Total prefers the ALL Performance chart change when provided.
 */
export default function ProfileStats({ stats, headlinePnl = null, loading, detailsLoading = false }) {
  if (loading || !stats) return <StatsSkeleton />;

  const usingChart = headlinePnl != null && Number.isFinite(headlinePnl);
  const displayPnl = usingChart ? headlinePnl : detailsLoading ? null : stats.pnl;
  const pnlTone = getValueState(displayPnl);
  const pnlClass = getToneClass(displayPnl);
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
          {displayPnl != null ? formatSignedCurrency(displayPnl) : "N/A"}
        </p>
        <p className="account-kpi-hero-hint">
          {usingChart
            ? "Available history · matches Performance chart"
            : detailsLoading
              ? "Loading complete account history..."
              : "Realized + unrealized · this account"}
        </p>
      </div>

      <div className="account-kpi-featured">
        <article className="account-kpi-card account-kpi-card-feature is-portfolio">
          <div className="account-kpi-card-icon" aria-hidden="true">
            <Wallet {...ICON} />
          </div>
          <div className="account-kpi-card-body">
            <span className="account-kpi-card-label">{detailsLoading ? "Open position value" : "Portfolio value"}</span>
            <span className="account-kpi-card-value">
              {stats.portfolioValue != null ? formatCurrency(stats.portfolioValue) : "N/A"}
            </span>
            {detailsLoading ? (
              <span className="account-kpi-card-meta">
                <LoaderCircle size={11} className="spin" aria-hidden="true" />
                Adding cash balance
              </span>
            ) : stats.cashBalance != null && stats.cashBalance > 0 ? (
              <span className="account-kpi-card-meta">
                Incl. {formatCompactCurrency(stats.cashBalance)} cash
              </span>
            ) : null}
          </div>
        </article>

        <article className="account-kpi-card account-kpi-card-feature is-volume">
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
        <div className="account-kpi-chip is-markets">
          <Layers3 {...ICON} className="account-kpi-chip-icon" aria-hidden="true" />
          <div>
            <span className="account-kpi-chip-label">Markets traded</span>
            <span className="account-kpi-chip-value">
              {stats.marketsTraded != null ? formatNumber(stats.marketsTraded) : "N/A"}
            </span>
          </div>
        </div>
        <div className="account-kpi-chip is-win-rate">
          <Percent {...ICON} className="account-kpi-chip-icon" aria-hidden="true" />
          <div>
            <span className="account-kpi-chip-label">Win rate</span>
            <span className="account-kpi-chip-value">
              {stats.winRate != null ? formatPercentage(stats.winRate) : "N/A"}
            </span>
          </div>
        </div>
        <div className="account-kpi-chip is-open-positions">
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
