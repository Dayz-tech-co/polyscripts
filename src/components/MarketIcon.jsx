const CATEGORY_COLORS = {
  Crypto: "#2E5CFF",
  Politics: "#5B8DEF",
  Economy: "#16C784",
  Sports: "#C4A35A",
  Weather: "#4FB6E8",
  Business: "#8B93A7",
  Tech: "#6E7AE8",
};

export default function MarketIcon({ category, tag, size = 28, radius = 0 }) {
  const color = CATEGORY_COLORS[category] || "#6b7380";
  return (
    <span
      className="market-icon"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
      }}
      aria-hidden="true"
    >
      {tag ? tag.slice(0, 2) : "·"}
    </span>
  );
}
