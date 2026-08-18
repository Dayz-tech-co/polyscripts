import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import Avatar from "./Avatar";
import { getLeaderboard } from "../services/ecosystemService";
import { shortenAddress } from "../utils/address";

// Popover account selector used by the comparison page. Lists the full demo
// roster, filterable by username or address, so two accounts can be picked
// quickly. Keyboard and click-outside aware like the rest of the controls.

export default function CompareSelect({ label, value, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    let active = true;
    getLeaderboard({ metric: "pnl", period: "ALL", limit: 25 })
      .then((list) => active && setAccounts(list))
      .catch(() => active && setAccounts([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !accounts) return accounts || [];
    return accounts.filter((a) => {
      const name = (a.username || a.displayName || "").toLowerCase();
      return name.includes(q) || a.address.toLowerCase().includes(q);
    });
  }, [accounts, query]);

  return (
    <div className="compare-select" ref={ref}>
      <span className="compare-select-label">{label}</span>
      <button
        type="button"
        className="compare-select-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value ? (
          <>
            <Avatar account={value} size={30} radius={9} />
            <span className="account-cell-text">
              <span className="account-cell-name">{value.username || value.displayName || shortenAddress(value.address)}</span>
              <span className="account-cell-address">{shortenAddress(value.address)}</span>
            </span>
          </>
        ) : (
          <span className="compare-select-placeholder">Choose an account</span>
        )}
        <ChevronDown size={15} className="top-account-arrow" aria-hidden="true" />
      </button>

      {open && (
        <div className="compare-select-menu" role="listbox" aria-label={`${label} options`}>
          <div className="inline-search compare-select-search">
            <Search size={14} className="inline-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="inline-search-input"
              placeholder="Filter accounts"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="inline-search-clear" aria-label="Clear filter" onClick={() => setQuery("")}>
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>
          <ul className="compare-select-list">
            {(visible || []).map((account) => {
              const selected = value?.address === account.address;
              return (
                <li key={account.address}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`compare-select-item ${selected ? "is-active" : ""}`}
                    onClick={() => {
                      onSelect(account);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Avatar account={account} size={28} radius={8} />
                    <span className="account-cell-text">
                      <span className="account-cell-name">{account.username || account.displayName || shortenAddress(account.address)}</span>
                      <span className="account-cell-address">{shortenAddress(account.address)}</span>
                    </span>
                    {selected && <Check size={15} className="compare-select-check" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}