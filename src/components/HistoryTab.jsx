import { useState } from "react";
import { Clock3 } from "lucide-react";
import PositionRow from "./PositionRow";
import PositionCardMobile from "./PositionCardMobile";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";

const PAGE_SIZE = 5;

export default function HistoryTab({ resolvedPositions, loading }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const list = resolvedPositions || [];
  const visible = list.slice(0, visibleCount);
  const hasMore = visibleCount < list.length;

  return (
    <section className="section" aria-label="Resolved position history">
      <div className="section-header">
        <div className="section-title-group">
          <h2 className="section-title">History</h2>
          {!loading && <span className="section-count">{list.length}</span>}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : list.length === 0 ? (
        <EmptyState icon={Clock3} title="No resolved positions" description="Resolved positions will appear here." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="positions-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Position</th>
                  <th>Shares</th>
                  <th>Invested</th>
                  <th>Returned</th>
                  <th>PnL</th>
                  <th>PnL%</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((position) => (
                  <PositionRow key={position.id} position={position} variant="resolved" />
                ))}
              </tbody>
            </table>
          </div>
          <div className="positions-mobile-list">
            {visible.map((position) => (
              <PositionCardMobile key={position.id} position={position} variant="resolved" />
            ))}
          </div>

          {hasMore && (
            <div className="load-more-row">
              <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
