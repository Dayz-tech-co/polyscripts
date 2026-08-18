import { Search, X } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Search markets", ariaLabel }) {
  return (
    <div className="inline-search">
      <Search size={14} className="inline-search-icon" aria-hidden="true" />
      <input
        type="search"
        className="inline-search-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel || placeholder}
      />
      {value && (
        <button
          type="button"
          className="inline-search-clear"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
