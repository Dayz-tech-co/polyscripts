// Utilities for recognizing and formatting Ethereum / Polygon style addresses.
// Polymarket accounts are identified by a proxy wallet address on Polygon, so
// every account in this app is ultimately keyed off one of these.

const FULL_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const PARTIAL_ADDRESS_RE = /^0x[a-fA-F0-9]{0,40}$/;

/**
 * True when the value is a complete, correctly formatted address:
 * "0x" followed by exactly 40 hexadecimal characters.
 */
export function isValidAddress(value) {
  return typeof value === "string" && FULL_ADDRESS_RE.test(value.trim());
}

/**
 * True as soon as the input *looks like* the start of an address, so the
 * search UI can switch into "address mode" while the user is still typing.
 */
export function looksLikeAddressInput(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.startsWith("0x") && PARTIAL_ADDRESS_RE.test(trimmed);
}

/**
 * Lowercases an address for use as a stable cache/identity key.
 * Returns the input unchanged if it isn't a valid address.
 */
export function normalizeAddress(address) {
  if (!address || typeof address !== "string") return address ?? null;
  return address.trim().toLowerCase();
}

/**
 * 0x3048d65321be3497164cdfc2996f94f98a2e7537 -> "0x3048...e7537"
 * Always operates on (and preserves) the full address internally.
 */
export function shortenAddress(address, startLen = 6, endLen = 5) {
  if (!address) return "";
  if (address.length <= startLen + endLen + 3) return address;
  return `${address.slice(0, startLen)}...${address.slice(-endLen)}`;
}
