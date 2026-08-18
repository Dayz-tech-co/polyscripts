import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";
import LogoMark from "./Logo";
import AccountSearch from "./AccountSearch";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        setMobileSearchOpen(false);
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
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              Explore
            </NavLink>
            <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              Leaderboard
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              Dashboard
            </NavLink>
            <NavLink to="/tools" className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              Tools
            </NavLink>
          </nav>
        </div>

        <div className="header-right">
          <div className="header-search-desktop">
            <AccountSearch variant="compact" />
          </div>

          <button
            type="button"
            className="icon-btn search-toggle"
            aria-label="Search accounts"
            aria-expanded={mobileSearchOpen}
            onClick={() => {
              setMobileSearchOpen((v) => !v);
              setMobileMenuOpen(false);
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
              setMobileSearchOpen(false);
            }}
          >
            {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="mobile-search-panel">
          <div className="container">
            <AccountSearch
              variant="mobile"
              autoFocus
              onNavigate={() => setMobileSearchOpen(false)}
            />
          </div>
        </div>
      )}

      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </header>
  );
}
