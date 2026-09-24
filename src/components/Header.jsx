import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Bookmark, CandlestickChart, Compass, Gift, LayoutDashboard, Menu, Search, Trophy, Waves, Wrench, X } from "lucide-react";
import LogoMark from "./Logo";
import MobileMenu from "./MobileMenu";
import { openPalette } from "../utils/palette";

const NAV = [
  { to: "/", label: "Explore", icon: Compass, end: true },
  { to: "/markets", label: "Markets", icon: CandlestickChart },
  { to: "/whales", label: "Whales", icon: Waves },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/tools", label: "Tools", icon: Wrench },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="app-header">
      <div className="container header-inner">
        <div className="header-left">
          <Link to="/" className="brand" aria-label="PolyScripts home">
            <LogoMark size={30} />
            <span className="brand-word">PolyScripts</span>
          </Link>
          <nav className="nav" aria-label="Primary">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`} title={label}>
                <Icon size={14} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="header-right">
          <button type="button" className="palette-trigger" onClick={openPalette} aria-label="Open command palette">
            <Search size={14} aria-hidden="true" />
            <span>Search anything</span>
            <kbd>⌘K</kbd>
          </button>

          <button
            type="button"
            className="icon-btn search-toggle"
            aria-label="Search"
            onClick={() => {
              setMobileMenuOpen(false);
              openPalette();
            }}
          >
            <Search size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="icon-btn mobile-menu-btn"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => {
              setMobileMenuOpen((v) => !v);
                  }}
          >
            {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </header>
  );
}
