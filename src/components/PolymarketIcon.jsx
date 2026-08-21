/** Polymarket brand mark (sharp square) for external profile links. */
export default function PolymarketIcon({ size = 14, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="24" height="24" fill="#2E5CFF" />
      <path
        d="M6.5 17.5V6.5h4.2c2.85 0 4.55 1.45 4.55 3.7 0 1.55-.75 2.7-2.05 3.25L17.5 17.5h-3.15l-3.9-3.85H9.3V17.5H6.5zm2.8-6.55h1.35c1.35 0 2.1-.65 2.1-1.7s-.75-1.7-2.1-1.7H9.3v3.4z"
        fill="#fff"
      />
    </svg>
  );
}
