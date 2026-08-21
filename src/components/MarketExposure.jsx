import { useMemo } from "react";
import { PieChart } from "lucide-react";
import { formatCompactCurrency, formatPercentage } from "../utils/formatters";

function buildExposure(positions) {
  const totals = new Map();
  let total = 0;
  for (const position of positions || []) {
    const value = Number.isFinite(position.currentValue) ? Math.max(0, position.currentValue) : 0;
    if (value === 0) continue;
    const category = position.category || "Other";
    totals.set(category, (totals.get(category) || 0) + value);
    total += value;
  }
  return [...totals.entries()]
    .map(([category, value]) => ({ category, value, share: total > 0 ? value / total : 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function concentrationLabel(share) {
  if (share >= 0.65) return "Concentrated";
  if (share >= 0.4) return "Moderate";
  return "Diversified";
}

export default function MarketExposure({ positions = [], loading }) {
  const exposure = useMemo(() => buildExposure(positions), [positions]);

  if (loading) {
    return <div className="card market-exposure-card"><div className="summary-loading" aria-hidden="true" /></div>;
  }

  const topShare = exposure[0]?.share ?? 0;

  return (
    <section className="card market-exposure-card" aria-labelledby="market-exposure-heading">
      <div className="market-exposure-header">
        <div>
          <span className="card-label" id="market-exposure-heading">Market exposure</span>
          <span className="card-description">Open-position allocation</span>
        </div>
        {exposure.length > 0 && <span className="exposure-risk">{concentrationLabel(topShare)}</span>}
      </div>

      {exposure.length === 0 ? (
        <div className="market-exposure-empty">
          <PieChart size={18} aria-hidden="true" />
          <span>No open exposure</span>
        </div>
      ) : (
        <div className="category-breakdown">
          {exposure.map(({ category, value, share }) => (
            <div className="category-row" key={category}>
              <div className="category-row-head">
                <span className="category-name">{category}</span>
                <span className="category-count">{formatCompactCurrency(value)} · {formatPercentage(share)}</span>
              </div>
              <div className="category-track" aria-hidden="true">
                <div className="category-fill" style={{ width: `${Math.max(3, share * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
