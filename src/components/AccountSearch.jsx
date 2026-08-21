import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, Search } from "lucide-react";
import SearchDropdown from "./SearchDropdown";
import { useAccountSearch } from "../hooks/useAccountSearch";
import { isValidAddress, normalizeAddress } from "../utils/address";
import { addRecentAccount, clearRecentAccounts, getRecentAccounts } from "../utils/recentSearches";

/**
 * The account search combobox. Used both as the homepage hero search and as
 * the compact control in the header - same behavior, different sizing via
 * the `variant` class.
 */
export default function AccountSearch({
  variant = "hero",
  placeholder = "Search username or wallet address",
  autoFocus = false,
  onNavigate,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState([]);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const listId = useId();

  const { results, loading, error, incompleteAddress, retry } = useAccountSearch(query);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  useEffect(() => {
    if (open && !query.trim()) setRecent(getRecentAccounts());
  }, [open, query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToAccount(account) {
    if (!account) return;
    addRecentAccount(account);
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    const identifier = account.username || account.address;
    navigate(`/profile/${encodeURIComponent(identifier)}`);
    onNavigate?.();
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (results.length > 0) setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        goToAccount(results[activeIndex]);
      } else if (isValidAddress(query.trim())) {
        e.preventDefault();
        goToAccount({ address: normalizeAddress(query.trim()), username: null });
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className={`account-search account-search-${variant}`} ref={containerRef}>
      <div className={`account-search-box ${open ? "is-focused" : ""}`}>
        <Search size={16} className="account-search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-label={placeholder}
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          className="account-search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {loading && <LoaderCircle size={15} className="account-search-spinner spin" aria-hidden="true" />}
      </div>

      {open && (
        <SearchDropdown
          listId={listId}
          query={query.trim()}
          loading={loading}
          error={error}
          results={results}
          incompleteAddress={incompleteAddress}
          activeIndex={activeIndex}
          onSelect={goToAccount}
          onHoverIndex={setActiveIndex}
          onRetry={retry}
          recent={recent}
          onSelectRecent={goToAccount}
          onClearRecent={() => {
            clearRecentAccounts();
            setRecent([]);
          }}
        />
      )}
    </div>
  );
}
