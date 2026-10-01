import { useMemo } from "react";
import { PanelSkeleton } from "./PageLoader";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatSignedCurrency,
} from "../utils/formatters";
import { getToneClass, getValueState } from "../utils/states";

function Val({ loading, value, format }) {
  if (loading && value == null) return <span className="stat-pulse" aria-hidden="true" />;
  if (value == null) return <span className="text-muted">—</span>;
  return format(value);
}

function MetricRow({ label, value, tone, hint }) {
  return (
    <div className="rail-metric">
      <div className="rail-metric-copy">
        <span className="rail-metric-label">{label}</span>
        {hint ? <span className="rail-metric-hint">{hint}</span> : null}
      </div>
      <span className={`rail-metric-value ${tone ? `tone-${tone}` : ""}`}>{value}</span>
    </div>
  );
}

function ExtremeRow({ label, trade, loading, toneHint }) {
  return (
    <div className={`rail-extreme tone-${toneHint}`}>
      <span className="rail-extreme-label">{label}</span>
      {loading ? (
        <span className="stat-pulse" style={{ width: 88, height: 14 }} />
      ) : trade ? (
        <div className="rail-extreme-body">
          <strong className={getToneClass(trade.pnl)}>{formatSignedCurrency(trade.pnl)}</strong>
          <span title={trade.market}>{trade.market}</span>
        </div>
      ) : (
        <span className="rail-extreme-empty">No resolved sample yet</span>
      )}
    </div>
  );
}

export default function OverviewStatsPanel({
  stats,
  resolvedPositions = [],
  activity = [],
  loading,
}) {
  const bestWorst = useMemo(() => {
    const known = (resolvedPositions || []).filter((p) => p.pnl != null && Number.isFinite(p.pnl));
    if (!known.length) return { best: null, worst: null };
    let best = known[0];
    let worst = known[0];
    for (const p of known) {
      if (p.pnl > best.pnl) best = p;
      if (p.pnl < worst.pnl) worst = p;
    }
    return { best, worst };
  }, [resolvedPositions]);

  if (loading && !stats) {
    return (
      <aside className="card stats-rail" aria-label="Loading stats">
        <PanelSkeleton rows={8} />
      </aside>
    );
  }

  const s = stats || {};
  const realized = s.realizedPnl ?? s.settledPnl ?? null;
  const resolvedCount =
    s.resolvedPositionsCount ??
    (Array.isArray(resolvedPositions) && resolvedPositions.length ? resolvedPositions.length : null);
  const tradesCount =
    s.activityCount ??
    (Array.isArray(activity) && activity.length ? activity.length : null);
  const sampleSize = (s.wins ?? 0) + (s.losses ?? 0);
  const hasWinSample = !loading && s.winRate != null && sampleSize > 0;
  const winPct = hasWinSample ? Math.max(0, Math.min(100, s.winRate * 100)) : 0;

  return (
    <aside className={`card stats-rail ${loading ? "is-hydrating" : ""}`} aria-label="Account stats">
      <header className="stats-rail-head">
        <div className="stats-rail-head-top">
          <span className="stats-rail-kicker">Edge</span>
          {loading ? <span className="stats-rail-live">Syncing…</span> : null}
        </div>
        <div className="stats-rail-win">
          <div className="stats-rail-win-num">
            <strong>{loading ? "…" : hasWinSample ? formatPercentage(s.winRate) : "—"}</strong>
            <span>Win rate</span>
          </div>
          <div className="stats-rail-win-meta">
            <div className="stats-rail-split" aria-hidden="true">
              <i className="is-win" style={{ width: `${hasWinSample ? winPct : 50}%` }} />
              <i className="is-loss" style={{ width: `${hasWinSample ? 100 - winPct : 50}%` }} />
            </div>
            <span>
              {loading ? (
                "Resolving closed positions"
              ) : hasWinSample ? (
                <>
                  <em className="tone-positive">{formatNumber(s.wins)}W</em>
                  <em className="tone-negative">{formatNumber(s.losses)}L</em>
                  <em className="text-muted">{formatNumber(sampleSize)} resolved</em>
                </>
              ) : (
                "Waiting on resolved history"
              )}
            </span>
          </div>
        </div>
      </header>

      <div className="stats-rail-group">
        <span className="stats-rail-group-label">PnL</span>
        <MetricRow
          label="Realized"
          value={<Val loading={loading} value={realized} format={formatCompactCurrency} />}
          tone={realized != null ? getValueState(realized) : null}
        />
        <MetricRow
          label="Unrealized"
          value={<Val loading={false} value={s.unrealizedPnl} format={formatCompactCurrency} />}
          tone={getValueState(s.unrealizedPnl)}
        />
      </div>

      <div className="stats-rail-group">
        <span className="stats-rail-group-label">Book</span>
        <MetricRow
          label="Open positions"
          value={<Val loading={false} value={s.openPositionsCount} format={formatNumber} />}
        />
        <MetricRow
          label="Open value"
          value={<Val loading={false} value={s.activePositionsValue} format={formatCompactCurrency} />}
        />
        <MetricRow
          label="Resolved"
          value={<Val loading={loading} value={resolvedCount} format={formatNumber} />}
        />
        <MetricRow
          label="Trades"
          value={<Val loading={loading} value={tradesCount} format={formatNumber} />}
        />
      </div>

      <div className="stats-rail-group">
        <span className="stats-rail-group-label">Quality</span>
        <MetricRow
          label="Avg win"
          value={<Val loading={loading} value={s.avgWin} format={formatCompactCurrency} />}
          tone={s.avgWin != null ? getValueState(s.avgWin) : null}
        />
        <MetricRow
          label="Avg loss"
          value={<Val loading={loading} value={s.avgLoss} format={formatCompactCurrency} />}
          tone={s.avgLoss != null ? getValueState(s.avgLoss) : null}
        />
        <MetricRow
          label="Markets"
          value={<Val loading={false} value={s.marketsTraded} format={formatNumber} />}
        />
        <MetricRow
          label="Avg size"
          value={<Val loading={loading} value={s.avgPositionSize} format={(v) => formatCurrency(v, { decimals: 0 })} />}
        />
      </div>

      <div className="stats-rail-extremes">
        <ExtremeRow label="Best" trade={bestWorst.best} loading={loading} toneHint="positive" />
        <ExtremeRow label="Worst" trade={bestWorst.worst} loading={loading} toneHint="negative" />
      </div>
    </aside>
  );
}
