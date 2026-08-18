import { NavLink } from "react-router-dom";

export default function MobileMenu({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="mobile-panel" role="dialog" aria-modal="true" aria-label="Site navigation">
      <nav className="mobile-panel-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `mobile-panel-link ${isActive ? "is-active" : ""}`}
          onClick={onClose}
        >
          Home
        </NavLink>
        <NavLink
          to="/leaderboard"
          className={({ isActive }) => `mobile-panel-link ${isActive ? "is-active" : ""}`}
          onClick={onClose}
        >
          Explore
        </NavLink>
      </nav>
      <button type="button" className="mobile-panel-scrim" aria-label="Close menu" onClick={onClose} />
    </div>
  );
}
