const KEY = "polyscripts:watchlist";
const EVENT = "polyscripts:watchlist-change";

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(accounts) {
  try {
    localStorage.setItem(KEY, JSON.stringify(accounts));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: accounts }));
  } catch {
    // Browsing profiles still works when storage is unavailable.
  }
}

function storedAccount(account) {
  return {
    address: account.address,
    username: account.username ?? null,
    displayName: account.displayName ?? null,
    avatar: account.avatar ?? null,
    addedAt: Date.now(),
  };
}

export function getWatchlist() {
  return read();
}

export function isAccountWatched(address) {
  const normalized = String(address || "").toLowerCase();
  return read().some((account) => account.address?.toLowerCase() === normalized);
}

export function toggleWatchlistAccount(account) {
  if (!account?.address) return false;
  const normalized = account.address.toLowerCase();
  const accounts = read();
  const exists = accounts.some((item) => item.address?.toLowerCase() === normalized);
  const next = exists
    ? accounts.filter((item) => item.address?.toLowerCase() !== normalized)
    : [storedAccount(account), ...accounts];
  write(next);
  return !exists;
}

export function removeWatchlistAccount(address) {
  const normalized = String(address || "").toLowerCase();
  write(read().filter((account) => account.address?.toLowerCase() !== normalized));
}

export function subscribeToWatchlist(listener) {
  function handleChange(event) {
    listener(event.detail || read());
  }
  function handleStorage(event) {
    if (event.key === KEY) listener(read());
  }
  window.addEventListener(EVENT, handleChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(EVENT, handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}
