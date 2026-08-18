// Original PolyScripts mark: a hexagonal outline with a geometric "P"
// monoline, rendered as inline SVG so it stays crisp at any size and never
// distorts or gets cropped.
export default function LogoMark({ size = 28, gradientId = "polyscripts-mark" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="PolyScripts"
    >
      <defs>
        <linearGradient id={gradientId} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF8A18" />
          <stop offset="0.55" stopColor="#FF5C45" />
          <stop offset="1" stopColor="#ED1976" />
        </linearGradient>
      </defs>
      <path
        d="M24 2.8 43.2 14v20L24 45.2 4.8 34V14L24 2.8Z"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M18.4 15.6h7.1c3.94 0 6.7 2.55 6.7 6.36 0 3.83-2.76 6.4-6.76 6.4h-3.34v6.08a1.6 1.6 0 0 1-1.6 1.6 1.6 1.6 0 0 1-1.6-1.6V17.2c0-.88.72-1.6 1.6-1.6Zm3.2 3.06v6.64h3.5c2.13 0 3.5-1.32 3.5-3.34 0-2-1.35-3.3-3.48-3.3h-3.52Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}
