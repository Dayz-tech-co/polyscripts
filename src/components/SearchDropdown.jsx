import { LoaderCircle, SearchX, Wallet } from "lucide-react";
import SearchResultItem from "./SearchResultItem";
import RecentSearches from "./RecentSearches";
import ErrorState from "./ErrorState";

export default function SearchDropdown({
  listId,
  query,
  loading,
  error,
  results,
  incompleteAddress,
  activeIndex,
  onSelect,
  onHoverIndex,
  onRetry,
  recent,
  onSelectRecent,
  onClearRecent,
}) {
  const showRecent = !query && recent && recent.length > 0;

  // Empty focus with no recents — parent should not mount us; guard anyway.
  if (!query && !showRecent && !loading && !error && !incompleteAddress) {
    return null;
  }

  return (
    <div className="search-dropdown" role="presentation">
      {showRecent ? (
        <RecentSearches accounts={recent} onSelect={onSelectRecent} onClear={onClearRecent} />
      ) : incompleteAddress ? (
        <div className="search-dropdown-hint">Keep typing the full wallet address</div>
      ) : error ? (
        <ErrorState title="Unable to search accounts" description="Please try again." onRetry={onRetry} />
      ) : loading && results.length === 0 ? (
        <div className="search-dropdown-loading">
          <LoaderCircle size={15} className="spin" aria-hidden="true" />
          <span>Searching accounts...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="search-dropdown-empty">
          <SearchX size={18} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p className="empty-state-title">No accounts found</p>
            <p className="empty-state-description">Check the username or wallet address and try again.</p>
          </div>
        </div>
      ) : (
        <ul id={listId} role="listbox" className="search-result-list" aria-label="Account results">
          {results.map((account, index) => (
            <SearchResultItem
              key={account.id || account.address}
              id={`${listId}-option-${index}`}
              account={account}
              active={index === activeIndex}
              onSelect={onSelect}
              onMouseEnter={() => onHoverIndex(index)}
            />
          ))}
        </ul>
      )}

      {!error && !incompleteAddress && query && results.length > 0 && (
        <div className="search-dropdown-footer">
          <Wallet size={11} aria-hidden="true" />
          <span>Public Polymarket accounts</span>
        </div>
      )}
    </div>
  );
}
