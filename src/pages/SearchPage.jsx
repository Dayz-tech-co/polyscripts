import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoaderCircle, Search, SearchX } from "lucide-react";
import SearchResultItem from "../components/SearchResultItem";
import ErrorState from "../components/ErrorState";
import { useAccountSearch } from "../hooks/useAccountSearch";
import { addRecentAccount } from "../utils/recentSearches";

/**
 * Optional /search?q= route: keeps the query in the URL so a search can be
 * shared or reloaded directly, backed by the same search hook as the
 * header/homepage combobox.
 */
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const { results, loading, error, incompleteAddress, retry } = useAccountSearch(query);

  useEffect(() => {
    document.title = query ? `Search "${query}" | PolyScripts` : "Search | PolyScripts";
  }, [query]);

  function handleChange(value) {
    setQuery(value);
    setParams(value ? { q: value } : {}, { replace: true });
  }

  function goToAccount(account) {
    addRecentAccount(account);
    navigate(`/profile/${encodeURIComponent(account.username || account.address)}`);
  }

  return (
    <main id="main-content" className="container main-content">
      <section className="section">
        <h1 className="section-title">Search accounts</h1>

        <div className="account-search-box" style={{ maxWidth: 480 }}>
          <Search size={16} className="account-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="account-search-input"
            placeholder="Search username or wallet address"
            value={query}
            autoFocus
            onChange={(e) => handleChange(e.target.value)}
          />
          {loading && <LoaderCircle size={15} className="account-search-spinner spin" aria-hidden="true" />}
        </div>

        {error ? (
          <ErrorState title="Unable to search accounts" description="Please try again." onRetry={retry} />
        ) : incompleteAddress ? (
          <p className="text-muted">Keep typing the full wallet address.</p>
        ) : !loading && query && results.length === 0 ? (
          <div className="empty-state">
            <SearchX size={20} strokeWidth={1.5} className="empty-state-icon" aria-hidden="true" />
            <p className="empty-state-title">No accounts found</p>
            <p className="empty-state-description">Check the username or wallet address and try again.</p>
          </div>
        ) : (
          <ul role="listbox" className="search-result-list search-page-list" aria-label="Account results">
            {results.map((account) => (
              <SearchResultItem
                key={account.id || account.address}
                account={account}
                active={false}
                onSelect={goToAccount}
                onMouseEnter={() => {}}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
