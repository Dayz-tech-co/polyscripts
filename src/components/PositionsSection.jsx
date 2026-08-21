import { useMemo, useState } from "react";
import { ChevronDown, Layers3 } from "lucide-react";
import Filters from "./Filters";
import SortDropdown from "./SortDropdown";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage,
  formatPrice,
  formatSignedCurrency,
} from "../utils/formatters";
import { getToneClass } from "../utils/states";

const SIDE_FILTERS = ["All", "YES", "NO"];
const SORT_OPTIONS = ["Highest Value", "Highest PnL", "Lowest PnL", "Newest"];

function sortPositions(positions, sort) {
  const sorted = [...positions];
  switch (sort) {
    case "Highest Value":
      return sorted.sort((a, b) => b.currentValue - a.currentValue);
    case "Highest PnL":
      return sorted.sort((a, b) => b.pnl - a.pnl);
    case "Lowest PnL":
      return sorted.sort((a, b) => a.pnl - b.pnl);
    case "Newest":
      return sorted.sort((a, b) => new Date(b.closeDate) - new Date(a.closeDate));
    default:
      return sorted;
  }
}

function OverviewRow({ position, expanded, onToggle }) {
  const pnlTone = getToneClass(position.pnl);
  const details = [
    { label: "Cost basis", value: formatCurrency(position.invested) },
    { label: "Current value", value: formatCurrency(position.currentValue) },
    { label: "Shares", value: position.shares != null ? formatNumber(position.shares) : "N/A" },
    { label: "PnL", value: formatSignedCurrency(position.pnl), tone: pnlTone },
    { label: "PnL %", value: formatPercentage(position.pnlPercent, { signed: true }), tone: pnlTone },
    {
      label: "Realized PnL",
      value: position.realizedPnl != null ? formatSignedCurrency(position.realizedPnl) : "N/A",
      tone: position.realizedPnl != null ? getToneClass(position.realizedPnl) : undefined,
    },
    { label: "Outcome", value: position.side },
    { label: "Closes", value: formatDate(position.closeDate) },
  ];

  return (
    <>
      <tr
        className={`position-row ${expanded ? "is-expanded" : ""}`}
        onClick={onToggle}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={expanded}
      >
        <td className="market-cell">
          <div className="market-cell-text">
            <span className="market-title" title={position.market}>
              {position.market}
            </span>
            <span className="market-meta">
              {position.category}
              {" · "}
              {`Closes ${formatDate(position.closeDate)}`}
            </span>
          </div>
        </td>
        <td>
          <span className={`side-badge side-${position.side.toLowerCase()}`}>{position.side}</span>
        </td>
        <td className="num-cell">{formatPrice(position.averagePrice)}</td>
        <td className="num-cell">{formatPrice(position.currentPrice)}</td>
        <td className="num-cell">{position.shares != null ? formatNumber(position.shares) : "N/A"}</td>
        <td className="num-cell">{formatCurrency(position.currentValue)}</td>
        <td className={`num-cell ${pnlTone}`}>{formatSignedCurrency(position.pnl)}</td>
        <td className={`num-cell ${pnlTone}`}>{formatPercentage(position.pnlPercent, { signed: true })}</td>
        <td className="action-cell">
          <span className={`expand-chevron ${expanded ? "is-open" : ""}`} aria-hidden="true">
            <ChevronDown size={14} />
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="position-detail-row">
          <td colSpan={9}>
            <div className="position-detail-grid">
              {details.map((item) => (
                <div className="position-detail-item" key={item.label}>
                  <span className="position-detail-label">{item.label}</span>
                  <span className={`position-detail-value ${item.tone ? `tone-${item.tone}` : ""}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function OverviewCardMobile({ position, expanded, onToggle }) {
  const pnlTone = getToneClass(position.pnl);

  return (
    <div className="position-card-mobile">
      <button type="button" className="position-card-mobile-main" onClick={onToggle} aria-expanded={expanded}>
        <div className="market-cell-text">
          <span className="market-title">{position.market}</span>
          <span className="market-meta">
            {position.category}
            {" · "}
            {`Closes ${formatDate(position.closeDate)}`}
          </span>
        </div>
        <span className={`side-badge side-${position.side.toLowerCase()}`}>{position.side}</span>
        <span className={`expand-chevron ${expanded ? "is-open" : ""}`} aria-hidden="true">
          <ChevronDown size={14} />
        </span>
      </button>
      <div className="position-card-mobile-grid">
        <div className="position-card-stat">
          <span className="position-card-stat-label">Value</span>
          <span className="position-card-stat-value">{formatCurrency(position.currentValue)}</span>
        </div>
        <div className="position-card-stat">
          <span className="position-card-stat-label">Current</span>
          <span className="position-card-stat-value">{formatPrice(position.currentPrice)}</span>
        </div>
        <div className="position-card-stat">
          <span className="position-card-stat-label">PnL</span>
          <span className={`position-card-stat-value ${pnlTone}`}>{formatSignedCurrency(position.pnl)}</span>
        </div>
      </div>
      {expanded && (
        <div className="position-card-mobile-detail">
          {[
            ["Entry", formatPrice(position.averagePrice)],
            ["Shares", position.shares != null ? formatNumber(position.shares) : "N/A"],
            ["PnL %", formatPercentage(position.pnlPercent, { signed: true })],
            ["Realized PnL", position.realizedPnl != null ? formatSignedCurrency(position.realizedPnl) : "N/A"],
          ].map(([label, value]) => (
            <div className="position-card-detail-row" key={label}>
              <span className="position-card-stat-label">{label}</span>
              <span className="position-card-stat-value">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PositionsSection({ positions, loading, limit }) {
  const [side, setSide] = useState("All");
  const [sort, setSort] = useState("Highest Value");
  const [expandedId, setExpandedId] = useState(null);

  const visible = useMemo(() => {
    let list = positions || [];
    if (side !== "All") list = list.filter((p) => p.side === side);
    list = sortPositions(list, sort);
    return limit ? list.slice(0, limit) : list;
  }, [positions, side, sort, limit]);

  function toggleExpanded(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <section className="section" aria-labelledby="open-positions-heading">
      <div className="section-header">
        <div className="section-title-group">
          <h2 className="section-title" id="open-positions-heading">
            Open Positions
          </h2>
          {!loading && <span className="section-count">{positions?.length ?? 0}</span>}
        </div>
        <div className="section-actions">
          <Filters options={SIDE_FILTERS} active={side} onChange={setSide} ariaLabel="Filter by position side" />
          <SortDropdown options={SORT_OPTIONS} value={sort} onChange={setSort} />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Layers3}
          title="No positions found"
          description="Try adjusting your filters."
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="positions-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Current</th>
                  <th>Shares</th>
                  <th>Value</th>
                  <th>PnL</th>
                  <th>PnL%</th>
                  <th aria-label="Details" />
                </tr>
              </thead>
              <tbody>
                {visible.map((position) => (
                  <OverviewRow
                    key={position.id}
                    position={position}
                    expanded={expandedId === position.id}
                    onToggle={() => toggleExpanded(position.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="positions-mobile-list">
            {visible.map((position) => (
              <OverviewCardMobile
                key={position.id}
                position={position}
                expanded={expandedId === position.id}
                onToggle={() => toggleExpanded(position.id)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
