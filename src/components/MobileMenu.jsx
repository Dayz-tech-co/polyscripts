export default function MobileMenu({ open, items, activeNav, onNavChange, onClose }) {
  if (!open) return null;

  return (
    <div className="mobile-panel" role="dialog" aria-modal="true" aria-label="Site navigation">
      <nav className="mobile-panel-nav">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className={`mobile-panel-link ${activeNav === item ? "is-active" : ""}`}
            onClick={() => onNavChange(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      <button type="button" className="mobile-panel-scrim" aria-label="Close menu" onClick={onClose} />
    </div>
  );
}
