// Small localStorage-backed list of the last few successfully opened
// profiles, so the search input can show a "Recent" section when focused
// and empty. Public account browsing only, nothing sensitive is stored.

const KEY = "polyscripts:recent-accounts";
const MAX = 5;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) - fail silently
  }
}

export function getRecentAccounts() {
  return read();
}

export function addRecentAccount(account) {
  if (!account || !account.address) return;
  const list = read().filter((a) => a.address !== account.address);
  list.unshift({
    address: account.address,
    username: account.username ?? null,
    displayName: account.displayName ?? null,
    avatar: account.avatar ?? null,
  });
  write(list.slice(0, MAX));
}

export function clearRecentAccounts() {
  write([]);
}
