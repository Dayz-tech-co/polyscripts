import { useMemo } from "react";
import { Brain } from "lucide-react";
import Badge from "./Badge";
import AnimatedNumber from "./AnimatedNumber";
import { Skeleton } from "./Skeleton";
import { categoryEdge, computeBadges, computeSmartScore } from "../utils/traderInsights";
import { formatPercentage, formatSignedCurrency } from "../utils/formatters";
import { getToneClass } from "../utils/states";

/** Smart Score, behaviour badges and per-category edge for one profile. */
export default function SmartScoreCard({ data, loading }) {
  const series = data?.pnlSeries;

  const insights = useMemo(() => {
    if (!data?.resolvedPositions) return null;
    const input = {
      stats: data.stats,
      account: data.account,
      resolvedPositions: data.resolvedPositions || [],
      activity: data.activity || [],
      pnlSeries: series || [],
    };
    return {
      smart: computeSmartScore(input),
      badges: computeBadges(input),
      edge: categoryEdge(input.resolvedPositions).slice(0, 6),
    };
  }, [data, series]);

  if (loading || !insights) {
    return (
      <section className="card smart-card" aria-label="Smart Score loading">
        <Skeleton width={140} height={16} />
        <Skeleton width="100%" height={80} style={{ marginTop: 12 }} />
      </section>
    );
  }

  const { smart, badges, edge } = insights;
  const tone = smart.score == null ? "neutral" : smart.score >= 30 ? "positive" : smart.score <= -10 ? "negative" : "neutral";
  const pct = smart.score == null ? 50 : (smart.score + 100) / 2;

  return (
    <section className="card smart-card" aria-labelledby="smart-card-title" data-reveal>
      <div className="smart-card-head">
        <span className="card-label" id="smart-card-title">
          <Brain size={14} aria-hidden="true" /> Smart Score
        </span>
        <span className="smart-card-sample">All-time PnL · last {smart.sample.toLocaleString("en-US")} resolved positions</span>
      </div>

      <div className="smart-card-body">
        <div className="smart-score">
          <strong className={`smart-score-value tone-${tone}`}><AnimatedNumber value={smart.score} format={(v) => (v == null ? "N/A" : Math.round(v) > 0 ? `+${Math.round(v)}` : Math.round(v))} /></strong>
          <span className="smart-score-grade">{smart.grade || "Not enough history"}</span>
          <div className="smart-score-meter" aria-hidden="true">
            <i style={{ "--pos": `${pct}%` }} />
          </div>
          <div className="smart-score-scale" aria-hidden="true"><span>-100</span><span>0</span><span>+100</span></div>
        </div>

        <ul className="smart-components stagger">
          {smart.components.map((c, i) => (
            <li key={c.key} style={{ "--i": i }}>
              <div className="smart-component-top">
                <span>{c.label}</span>
                <strong className={getToneClass(c.value)}>{c.value > 0 ? `+${c.value}` : c.value} / {c.max}</strong>
              </div>
              <div className="smart-component-bar">
                <i className={`grow-bar-fill ${c.value >= 0 ? "is-pos" : "is-neg"}`} style={{ width: `${(Math.abs(c.value) / c.max) * 50}%` }} />
              </div>
              <small>{c.note}</small>
            </li>
          ))}
          {smart.score == null && <li className="smart-empty">Not enough public trading history to score this account yet.</li>}
        </ul>
      </div>

      {badges.length > 0 && (
        <div className="smart-badges stagger" aria-label="Trader badges">
          {badges.map((b, i) => <span key={b.key} style={{ "--i": i }}><Badge label={b.label} tone={b.tone} hint={b.hint} /></span>)}
        </div>
      )}

      {edge.length > 0 && (
        <div className="smart-edge">
          <span className="smart-edge-title">Edge by category</span>
          <table>
            <thead>
              <tr><th>Category</th><th>Positions</th><th>Win rate</th><th>Realized PnL</th></tr>
            </thead>
            <tbody>
              {edge.map((g) => (
                <tr key={g.category}>
                  <td>{g.category}</td>
                  <td>{g.count}</td>
                  <td>{formatPercentage(g.winRate, { decimals: 0 })}</td>
                  <td className={getToneClass(g.pnl)}>{formatSignedCurrency(g.pnl, { decimals: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="smart-card-note">Computed from this account&apos;s official all-time PnL, volume, resolved positions and activity. Categories are inferred from market titles. Hover a badge to see its rule.</p>
    </section>
  );
}
