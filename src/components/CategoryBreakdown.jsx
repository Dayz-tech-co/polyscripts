// Category breakdown as a compact progress list, showing how many observed
// markets each category contributes. Shares are relative to the largest
// category so bars stay visually balanced.

export default function CategoryBreakdown({ categories }) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="category-breakdown">
      {categories.map(({ category, count, share }) => (
        <div className="category-row" key={category}>
          <div className="category-row-head">
            <span className="category-name">{category}</span>
            <span className="category-count">{count}</span>
          </div>
          <div className="category-track" aria-hidden="true">
            <div className="category-fill" style={{ width: `${Math.max(4, share * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}