// Deterministic flat avatar fallbacks (no gradients). Same seed → same color.

const FLAT_COLORS = [
  "#2E5CFF",
  "#16C784",
  "#EA3943",
  "#5B8DEF",
  "#8B93A7",
  "#C4A35A",
  "#6E7AE8",
  "#3D9B8F",
];

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** @returns {[string, string]} same color twice for API compatibility with old gradient callers */
export function getAvatarGradient(seed) {
  const key = String(seed || "polyscripts");
  const color = FLAT_COLORS[hashString(key) % FLAT_COLORS.length];
  return [color, color];
}

export function getAvatarColor(seed) {
  return getAvatarGradient(seed)[0];
}

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

export function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
