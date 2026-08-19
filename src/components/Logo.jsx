// Real PolyScripts logo served from /public/logo.png. Rendered as an <img>
// so the exact brand mark is used consistently in the header and as the
// favicon, instead of being re-drawn inline.
export default function LogoMark({ size = 28, className = "brand-logo" }) {
  return <img src="/logo.png" alt="PolyScripts" width={size} height={size} className={className} />;
}