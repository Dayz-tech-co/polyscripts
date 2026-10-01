import { useState } from "react";
import MarketIcon from "./MarketIcon";
import { isValidImageUrl } from "../utils/avatar";

/**
 * Market image with circular crop + instant colored fallback (no grey square).
 */
export default function MarketImage({ icon, category, tag, size = 40, radius = 999 }) {
  const [failed, setFailed] = useState(false);
  const showImage = !failed && isValidImageUrl(icon);
  const round = radius >= 999 || radius === "50%" ? "50%" : radius;

  if (showImage) {
    return (
      <img
        src={icon}
        alt=""
        width={size}
        height={size}
        className="market-image is-circle"
        style={{ width: size, height: size, borderRadius: round, objectFit: "cover" }}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return <MarketIcon category={category} tag={tag} size={size} />;
}
