const CATEGORY_COLORS = {
  Crypto: ["#FF8A18", "#ED1976"],
  Politics: ["#5B8DEF", "#7C5CFF"],
  Economy: ["#28C79A", "#1C9C7A"],
  Sports: ["#FFB347", "#FF6A3D"],
  Weather: ["#4FB6E8", "#2E7FBF"],
  Business: ["#B08BFF", "#7C5CFF"],
  Tech: ["#FF5C45", "#ED1976"],
};

export default function MarketIcon({ category, tag, size = 28 }) {
  const [from, to] = CATEGORY_COLORS[category] || ["#697586", "#4B5563"];
  return (
    <span
      className="market-icon"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      aria-hidden="true"
    >
      {tag ? tag.slice(0, 2) : "PS"}
    </span>
  );
}
