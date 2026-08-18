import Avatar from "./Avatar";
import { shortenAddress } from "../utils/address";

export default function RecentSearches({ accounts, onSelect, onClear }) {
  if (!accounts || accounts.length === 0) return null;

  return (
    <div className="recent-searches">
      <div className="recent-searches-head">
        <span className="recent-searches-title">Recent</span>
        <button type="button" className="recent-searches-clear" onClick={onClear}>
          Clear
        </button>
      </div>
      <ul role="listbox" className="search-result-list">
        {accounts.map((account) => (
          <li
            key={account.address}
            role="option"
            className="search-result-item"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(account);
            }}
          >
            <Avatar account={account} size={32} radius={9} />
            <div className="search-result-text">
              <span className="search-result-primary">{account.username || shortenAddress(account.address)}</span>
              <span className="search-result-secondary">
                {account.username ? shortenAddress(account.address) : "Wallet account"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
