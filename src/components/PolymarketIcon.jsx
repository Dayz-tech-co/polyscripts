/** Official Polymarket brand icon (from polymarket.com/brand). */
export default function PolymarketIcon({ size = 14, className = "" }) {
  return (
    <img
      className={`polymarket-icon ${className}`.trim()}
      src="/brand/polymarket-icon-blue.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
