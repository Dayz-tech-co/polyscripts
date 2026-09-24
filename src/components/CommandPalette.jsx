import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  CandlestickChart,
  Compass,
  CornerDownLeft,
  Gift,
  GitCompareArrows,
  LayoutDashboard,
  Scale,
  Search,
  Trophy,
  Waves,
  Wrench,
} from "lucide-react";
import Avatar from "./Avatar";
import MarketImage from "./MarketImage";
import { useAccountSearch } from "../hooks/useAccountSearch";
import { searchMarkets } from "../services/marketService";
import { getRecentAccounts } from "../utils/recentSearches";
import { shortenAddress } from "../utils/address";
import { formatCompactCurrency, formatPrice } from "../utils/formatters";
import { PALETTE_EVENT } from "../utils/palette";

const PAGES = [
  { label: "Explore", to: "/", icon: Compass, keywords: "home search" },
  { label: "Markets", to: "/markets", icon: CandlestickChart, keywords: "odds prices movers" },
  { label: "Whale Tracker", to: "/whales", icon: Waves, keywords: "big trades insider live" },
  { label: "Arbitrage Scanner", to: "/arbitrage", icon: Scale, keywords: "arb mispricing edge" },
  { label: "Leaderboard", to: "/leaderboard", icon: Trophy, keywords: "top traders rank" },
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, keywords: "pulse volume" },
  { label: "Watchlist feed", to: "/watchlist", icon: Bookmark, keywords: "following alerts" },
  { label: "Rewards", to: "/rewards", icon: Gift, keywords: "lp rebates card" },
  { label: "Compare accounts", to: "/compare", icon: GitCompareArrows, keywords: "versus vs" },
  { label: "Tools", to: "/tools", icon: Wrench, keywords: "checker" },
];

function accountName(a) {
  return a.username || a.displayName || shortenAddress(a.address);
}

/** Global ⌘K / Ctrl+K palette: jump to any page, trader or market. */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [markets, setMarkets] = useState([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { results: accounts, loading } = useAccountSearch(open ? query : "");

  useEffect(() => {
    function onKey(event) {
      const typing = /input|textarea|select/i.test(event.target?.tagName) || event.target?.isContentEditable;
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((v) => !v);
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setOpen(true);
      }
    }
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setActive(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setMarkets([]);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchMarkets(q, { signal: controller.signal })
        .then((list) => setMarkets(list.slice(0, 6)))
        .catch(() => {});
    }, 260);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = PAGES.filter((p) => !q || `${p.label} ${p.keywords}`.toLowerCase().includes(q)).map((p) => ({
      key: `page-${p.to}`,
      group: "Pages",
      to: p.to,
      label: p.label,
      icon: p.icon,
    }));
    const people = (q ? accounts : getRecentAccounts()).slice(0, 6).map((a) => ({
      key: `acct-${a.address}`,
      group: q ? "Traders" : "Recently viewed",
      to: `/profile/${encodeURIComponent(a.username || a.address)}`,
      label: accountName(a),
      sub: shortenAddress(a.address),
      account: a,
    }));
    const mkts = markets.map((m) => ({
      key: `mkt-${m.conditionId}`,
      group: "Markets",
      to: `/market/${encodeURIComponent(m.slug || m.conditionId)}`,
      label: m.question,
      sub: `${formatPrice(m.outcomes[0]?.price)} ${m.outcomes[0]?.name || ""} · ${formatCompactCurrency(m.volume24h)} 24h`,
      market: m,
    }));
    return q ? [...people, ...mkts, ...pages] : [...pages, ...people];
  }, [query, accounts, markets]);

  useEffect(() => {
    setActive((i) => Math.min(i, Math.max(0, items.length - 1)));
  }, [items.length]);

  useEffect(() => {
    listRef.current?.querySelector(".palette-item.is-active")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  function go(item) {
    if (!item) return;
    setOpen(false);
    navigate(item.to);
  }

  function onKeyDown(event) {
    if (event.key === "Escape") setOpen(false);
    else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % Math.max(1, items.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + items.length) % Math.max(1, items.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(items[active]);
    }
  }

  let lastGroup = null;
  return (
    <div className="palette-root" role="dialog" aria-modal="true" aria-label="Command palette">
      <button type="button" className="palette-scrim" aria-label="Close" onClick={() => setOpen(false)} />
      <div className="palette">
        <div className="palette-input-row">
          <Search size={17} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search traders, markets or pages…"
            aria-label="Search"
            aria-activedescendant={items[active]?.key}
          />
          {loading && <span className="palette-spinner" aria-hidden="true" />}
          <kbd>esc</kbd>
        </div>
        <ul className="palette-list" ref={listRef} role="listbox">
          {items.length === 0 && <li className="palette-empty">{query.trim().length < 2 ? "Type to search" : "No matches"}</li>}
          {items.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <li key={item.key} role="presentation">
                {header && <div className="palette-group">{header}</div>}
                <button
                  type="button"
                  id={item.key}
                  role="option"
                  aria-selected={index === active}
                  className={`palette-item ${index === active ? "is-active" : ""}`}
                  style={{ "--i": Math.min(index, 12) }}
                  onMouseMove={() => setActive(index)}
                  onClick={() => go(item)}
                >
                  <span className="palette-item-icon">
                    {item.account ? <Avatar account={item.account} size={26} /> : item.market ? <MarketImage icon={item.market.icon} tag="MKT" size={26} radius={6} /> : Icon ? <Icon size={16} /> : null}
                  </span>
                  <span className="palette-item-text">
                    <strong>{item.label}</strong>
                    {item.sub && <small>{item.sub}</small>}
                  </span>
                  {index === active ? <CornerDownLeft size={14} className="palette-enter" /> : <ArrowRight size={14} className="palette-arrow" />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>⌘</kbd><kbd>K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
