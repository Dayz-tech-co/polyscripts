import { useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import LogoMark from "./Logo";
import MobileMenu from "./MobileMenu";

const NAV_ITEMS = ["Overview", "Markets", "Analytics"];

export default function Header({ activeNav, onNavChange, searchQuery, onSearchChange }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="app-header">
      <div className="container header-inner">
        <div className="header-left">
          <a href="#top" className="brand" aria-label="PolyScripts home">
            <LogoMark size={26} />
            <span className="brand-word">PolyScripts</span>
          </a>
          <nav className="nav" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                className={`nav-link ${activeNav === item ? "is-active" : ""}`}
                onClick={() => onNavChange(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="header-right">
          <div className={`search-control ${searchOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="icon-btn search-toggle"
              aria-label="Search markets"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search size={16} aria-hidden="true" />
            </button>
            <input
              ref={searchRef}
              type="search"
              className="search-input"
              placeholder="Search markets"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onBlur={() => {
                if (!searchQuery) setSearchOpen(false);
              }}
              aria-label="Search markets"
            />
          </div>

          <button
            type="button"
            className="icon-btn mobile-menu-btn"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <MobileMenu
        open={mobileOpen}
        items={NAV_ITEMS}
        activeNav={activeNav}
        onNavChange={(item) => {
          onNavChange(item);
          setMobileOpen(false);
        }}
        onClose={() => setMobileOpen(false)}
      />
    </header>
  );
}
