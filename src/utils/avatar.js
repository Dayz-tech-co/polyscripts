// Deterministic fallback avatar generation. When an account has no public
// avatar image, we derive a small gradient + initials from its identifier so
// the same account always renders the same placeholder, without ever using
// the PolyScripts brand logo as a stand-in for a trader's identity.

const GRADIENT_PAIRS = [
  ["#FF8A18", "#ED1976"],
  ["#FF5C45", "#7C5CFF"],
  ["#5B8DEF", "#28C79A"],
  ["#B08BFF", "#FF5C45"],
  ["#28C79A", "#5B8DEF"],
  ["#FFB347", "#ED1976"],
  ["#4FB6E8", "#B08BFF"],
];

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Picks a stable gradient pair for a given account identifier (address,
 * username, anything unique and consistent works).
 */
export function getAvatarGradient(seed) {
  const key = String(seed || "polyscripts");
  const index = hashString(key) % GRADIENT_PAIRS.length;
  return GRADIENT_PAIRS[index];
}

/**
 * Best-effort initials: prefer a username/display name, fall back to the
 * first characters of the wallet address, and finally a neutral glyph.
 */
export function getInitials({ username, displayName, address }) {
  const label = username || displayName;
  if (label) {
    const cleaned = label.replace(/[^a-zA-Z0-9]/g, "");
    if (cleaned.length >= 2) return cleaned.slice(0, 2).toUpperCase();
    if (cleaned.length === 1) return cleaned.toUpperCase();
  }
  if (address && address.length >= 4) {
    return address.slice(2, 4).toUpperCase();
  }
  return "?";
}

/**
 * Only ever trust http(s) URLs as avatar sources.
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
