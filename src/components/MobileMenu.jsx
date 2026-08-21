import { NavLink } from "react-router-dom";
import { Compass, LayoutDashboard, Trophy, Wrench } from "lucide-react";

const LINKS = [
  { to: "/", label: "Explore", icon: Compass, end: true },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tools", label: "Tools", icon: Wrench },
];

export default function MobileMenu({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="mobile-panel" role="dialog" aria-modal="true" aria-label="Site navigation">
      <nav className="mobile-panel-nav">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-panel-link ${isActive ? "is-active" : ""}`}
            onClick={onClose}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <button type="button" className="mobile-panel-scrim" aria-label="Close menu" onClick={onClose} />
    </div>
  );
}
