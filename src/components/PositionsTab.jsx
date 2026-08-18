import { useMemo, useState } from "react";
import { Layers3 } from "lucide-react";
import SearchInput from "./SearchInput";
import Filters from "./Filters";
import SortDropdown from "./SortDropdown";
import MarketIcon from "./MarketIcon";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";
import { formatCurrency, formatDate, formatPrice, formatSignedCurrency } from "../utils/formatters";

const STATUS_FILTERS = ["All", "Open", "Resolved"];
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

function UnifiedRow({ position }) {
  const pnlTone = position.pnl >= 0 ? "positive" : "negative";
  const isOpen = position.status === "open";

  return (
    <tr className="position-row">
      <td className="market-cell">
        <MarketIcon category={position.category} tag={position.tag} />
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
        <span className={`side-badge side-${position.side.toLowerCase()}`}>{position.side}</span>
      </td>
      <td className="num-cell">{formatPrice(position.averagePrice)}</td>
      <td className="num-cell">{formatCurrency(position.currentValue)}</td>
      <td className={`num-cell tone-${pnlTone}`}>{formatSignedCurrency(position.pnl)}</td>
      <td>
        <span className={`status-pill ${isOpen ? "status-open" : "status-resolved"}`}>
          {isOpen ? "Open" : "Resolved"}
        </span>
      </td>
    </tr>
  );
}

function UnifiedCardMobile({ position }) {
  const pnlTone = position.pnl >= 0 ? "positive" : "negative";
  const isOpen = position.status === "open";

  return (
    <div className="position-card-mobile">
      <div className="position-card-mobile-head">
        <MarketIcon category={position.category} tag={position.tag} />
        <div className="market-cell-text">
          <span className="market-title">{position.market}</span>
          <span className="market-meta">
            {position.category}
            {" · "}
            {isOpen ? `Closes ${formatDate(position.closeDate)}` : `Resolved ${formatDate(position.closeDate)}`}
          </span>
        </div>
        <span className={`side-badge side-${position.side.toLowerCase()}`}>{position.side}</span>
      </div>
      <div className="position-card-mobile-grid">
        <div className="position-card-stat">
          <span className="position-card-stat-label">Value</span>
          <span className="position-card-stat-value">{formatCurrency(position.currentValue)}</span>
        </div>
        <div className="position-card-stat">
          <span className="position-card-stat-label">PnL</span>
          <span className={`position-card-stat-value tone-${pnlTone}`}>{formatSignedCurrency(position.pnl)}</span>
        </div>
        <div className="position-card-stat">
          <span className="position-card-stat-label">Status</span>
          <span className={`status-pill ${isOpen ? "status-open" : "status-resolved"}`}>
            {isOpen ? "Open" : "Resolved"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PositionsTab({ openPositions, resolvedPositions, loading, query, onQueryChange }) {
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("Highest Value");

  const combined = useMemo(() => {
    const open = (openPositions || []).map((p) => ({ ...p, currentValue: p.currentValue }));
    const resolved = (resolvedPositions || []).map((p) => ({ ...p, currentValue: p.returned }));
    return [...open, ...resolved];
  }, [openPositions, resolvedPositions]);

  const visible = useMemo(() => {
    let list = combined;
    if (status !== "All") list = list.filter((p) => p.status === status.toLowerCase());
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.market.toLowerCase().includes(q));
    }
    return sortPositions(list, sort);
  }, [combined, status, query, sort]);

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
          <div className="table-wrap">
            <table className="positions-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Position</th>
                  <th>Average</th>
                  <th>Value</th>
                  <th>PnL</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((position) => (
                  <UnifiedRow key={position.id} position={position} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="positions-mobile-list">
            {visible.map((position) => (
              <UnifiedCardMobile key={position.id} position={position} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
