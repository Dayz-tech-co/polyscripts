import { getAvatarColor } from "../utils/avatar";

const CATEGORY_COLORS = {
  Crypto: "#3888ff",
  Politics: "#7c9cff",
  Economy: "#2fb57e",
  Sports: "#ff8c38",
  Weather: "#4fb6e8",
  Business: "#94a3b8",
  Tech: "#6e7ae8",
};

function initials(tag) {
  if (!tag) return "·";
  const cleaned = String(tag).replace(/[^a-zA-Z0-9]/g, "");
  if (cleaned.length >= 2) return cleaned.slice(0, 2).toUpperCase();
  if (cleaned.length === 1) return cleaned.toUpperCase();
  return "·";
}

function shade(hex, amount) {
  const raw = hex.replace("#", "");
  const num = parseInt(raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw, 16);
  if (!Number.isFinite(num)) return hex;
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Circular market glyph — never a grey square. */
export default function MarketIcon({ category, tag, size = 28 }) {
  const label = initials(tag);
  const seed = tag || category || "market";
  const color = CATEGORY_COLORS[category] || getAvatarColor(seed);
  const deep = shade(color, -42);

  return (
    <span
      className="market-icon is-circle"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(145deg, ${color} 0%, ${deep} 100%)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.16)`,
        fontSize: Math.max(9, Math.round(size * 0.34)),
      }}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}
