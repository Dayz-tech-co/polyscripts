// Consistent page header used by every top-level ecosystem page so the
// Explore, Leaderboard, Dashboard, Tools, Compare and Ecosystem screens all
// open with the same compact, quiet title treatment.

export default function PageHeader({ title, description, eyebrow, children }) {
  return (
    <div className="page-head">
      <div className="page-head-text">
        {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children && <div className="page-head-actions">{children}</div>}
    </div>
  );
}