import { useMemo, useState } from "react";
import { ChevronDown, Layers3 } from "lucide-react";
import SearchInput from "./SearchInput";
import Filters from "./Filters";
import SortDropdown from "./SortDropdown";
import MarketImage from "./MarketImage";
import MarketLink from "./MarketLink";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";
import { formatCurrency, formatDate, formatNumber, formatPercentage, formatPrice, formatSignedCurrency } from "../utils/formatters";
import { getToneClass } from "../utils/states";

const STATUS_FILTERS = ["Active", "Closed"];
const SORT_OPTIONS = ["Highest Value", "Highest PnL", "Lowest PnL", "Newest"];

function sortPositions(positions, sort) {
  const sorted = [...positions];
  switch (sort) {
    case "Highest Value":
      return sorted.sort((a, b) => (b.currentValue ?? 0) - (a.currentValue ?? 0));
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

function UnifiedRow({ position, expanded, onToggle }) {
  const pnlTone = getToneClass(position.pnl);
  const isOpen = position.status === "open";
  const closedPrice = !isOpen && position.shares > 0 ? position.returned / position.shares : null;

  const detail = [
    { label: "Cost basis", value: formatCurrency(position.invested) },
    { label: "Current value", value: formatCurrency(position.currentValue) },
    {
      label: "Unrealized PnL",
      value: isOpen ? formatSignedCurrency(position.pnl) : "N/A",
      tone: isOpen ? pnlTone : undefined,
    },
    {
      label: "Realized PnL",
      value:
        isOpen
          ? position.realizedPnl != null
            ? formatSignedCurrency(position.realizedPnl)
            : "N/A"
          : formatSignedCurrency(position.pnl),
      tone: isOpen && position.realizedPnl != null ? getToneClass(position.realizedPnl) : pnlTone,
    },
    { label: "Shares", value: position.shares != null ? formatNumber(position.shares) : "N/A" },
    { label: "Outcome", value: position.side },
    { label: isOpen ? "Closes" : "Resolved", value: formatDate(position.closeDate) },
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
          <MarketImage icon={position.icon} category={position.category} tag={position.tag} size={40} />
          <div className="market-cell-text">
            <span className="market-title" title={position.market}>
              {position.market}
            </span>
            <span className="market-meta">
              {position.category}
              {" · "}
              {isOpen ? `Closes ${formatDate(position.closeDate)}` : `Resolved ${formatDate(position.closeDate)}`}
            </span>
          </div>
        </td>
        <td>
          <span className={`side-badge side-${position.side.toLowerCase().replace(/\s+/g, "-")}`} title={position.side}>{position.side}</span>
        </td>
        <td className="num-cell">{formatPrice(position.averagePrice)}</td>
        <td className="num-cell">{isOpen ? formatPrice(position.currentPrice) : formatPrice(closedPrice)}</td>
        <td className="num-cell">{formatCurrency(position.currentValue)}</td>
        <td className={`num-cell ${pnlTone}`}>{formatSignedCurrency(position.pnl)}</td>
        <td className={`num-cell ${pnlTone}`}>{formatPercentage(position.pnlPercent, { signed: true })}</td>
        <td>
          <span className={`status-pill ${isOpen ? "status-open" : "status-resolved"}`}>
            {isOpen ? "Active" : "Closed"}
          </span>
        </td>
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
              {detail.map((item) => (
                <div className="position-detail-item" key={item.label}>
                  <span className="position-detail-label">{item.label}</span>
                  <span className={`position-detail-value ${item.tone ? `tone-${item.tone}` : ""}`}>{item.value}</span>
                </div>
              ))}
              <MarketLink position={position} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function UnifiedCardMobile({ position, expanded, onToggle }) {
  const pnlTone = getToneClass(position.pnl);
  const isOpen = position.status === "open";

  return (
    <div className="position-card-mobile">
      <button type="button" className="position-card-mobile-main" onClick={onToggle} aria-expanded={expanded}>
        <MarketImage icon={position.icon} category={position.category} tag={position.tag} size={40} />
        <div className="market-cell-text">
          <span className="market-title">{position.market}</span>
          <span className="market-meta">
            {position.category}
            {" · "}
            {isOpen ? `Closes ${formatDate(position.closeDate)}` : `Resolved ${formatDate(position.closeDate)}`}
          </span>
        </div>
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
          <span className="position-card-stat-label">PnL</span>
          <span className={`position-card-stat-value ${pnlTone}`}>{formatSignedCurrency(position.pnl)}</span>
        </div>
        <div className="position-card-stat">
          <span className="position-card-stat-label">Status</span>
          <span className={`status-pill ${isOpen ? "status-open" : "status-resolved"}`}>
            {isOpen ? "Active" : "Closed"}
          </span>
        </div>
      </div>
      {expanded && (
        <div className="position-card-mobile-detail">
          {[
            ["Entry", formatPrice(position.averagePrice)],
            ["Current", isOpen ? formatPrice(position.currentPrice) : formatPrice(position.invested ? position.returned / position.shares : null)],
            ["PnL %", formatPercentage(position.pnlPercent, { signed: true })],
            ["Shares", position.shares != null ? formatNumber(position.shares) : "N/A"],
            ["Realized PnL", isOpen ? (position.realizedPnl != null ? formatSignedCurrency(position.realizedPnl) : "N/A") : formatSignedCurrency(position.pnl)],
          ].map(([label, value]) => (
            <div className="position-card-detail-row" key={label}>
              <span className="position-card-stat-label">{label}</span>
              <span className="position-card-stat-value">{value}</span>
            </div>
          ))}
          <MarketLink position={position} />
        </div>
      )}
    </div>
  );
}

export default function PositionsTab({ openPositions, resolvedPositions, loading, query, onQueryChange }) {
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("Highest Value");
  const [expandedId, setExpandedId] = useState(null);

  const combined = useMemo(() => {
    const open = (openPositions || []).map((p) => ({ ...p, currentValue: p.currentValue }));
    const resolved = (resolvedPositions || []).map((p) => ({ ...p, currentValue: p.returned }));
    return [...open, ...resolved];
  }, [openPositions, resolvedPositions]);

  const visible = useMemo(() => {
    let list = combined;
    if (status === "Active") list = list.filter((p) => p.status === "open");
    if (status === "Closed") list = list.filter((p) => p.status === "resolved");
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.market.toLowerCase().includes(q));
    }
    return sortPositions(list, sort);
  }, [combined, status, query, sort]);

  function toggleExpanded(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <section className="section" aria-label="All positions">
      <div className="section-header">
        <div className="section-title-group">
          <h2 className="section-title">Positions</h2>
          {!loading && <span className="section-count">{combined.length}</span>}
        </div>
      </div>

      <div className="tab-controls-row">
        <SearchInput value={query} onChange={onQueryChange} placeholder="Search positions" />
        <div className="tab-controls-right">
          <Filters options={STATUS_FILTERS} active={status} onChange={setStatus} ariaLabel="Filter by status" />
          <SortDropdown options={SORT_OPTIONS} value={sort} onChange={setSort} />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Layers3} title="No positions found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="table-wrap positions-scroll">
            <table className="positions-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Outcome</th>
                  <th>Entry</th>
                  <th>Current</th>
                  <th>Value</th>
                  <th>PnL</th>
                  <th>PnL%</th>
                  <th>Status</th>
                  <th aria-label="Details" />
                </tr>
              </thead>
              <tbody>
                {visible.map((position) => (
                  <UnifiedRow
                    key={position.id}
                    position={position}
                    expanded={expandedId === position.id}
                    onToggle={() => toggleExpanded(position.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="positions-mobile-list positions-scroll-mobile">
            {visible.map((position) => (
              <UnifiedCardMobile
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
