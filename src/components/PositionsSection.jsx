import { useMemo, useState } from "react";
import { Layers3 } from "lucide-react";
import Filters from "./Filters";
import SortDropdown from "./SortDropdown";
import PositionRow from "./PositionRow";
import PositionCardMobile from "./PositionCardMobile";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";

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

export default function PositionsSection({ positions, loading, limit }) {
  const [side, setSide] = useState("All");
  const [sort, setSort] = useState("Highest Value");

  const visible = useMemo(() => {
    let list = positions || [];
    if (side !== "All") list = list.filter((p) => p.side === side);
    list = sortPositions(list, sort);
    return limit ? list.slice(0, limit) : list;
  }, [positions, side, sort, limit]);

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
                  <th>Position</th>
                  <th>Average</th>
                  <th>Current</th>
                  <th>Value</th>
                  <th>PnL</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map((position) => (
                  <PositionRow key={position.id} position={position} variant="open" />
                ))}
              </tbody>
            </table>
          </div>

          <div className="positions-mobile-list">
            {visible.map((position) => (
              <PositionCardMobile key={position.id} position={position} variant="open" />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
