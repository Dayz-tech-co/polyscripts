import { useState } from "react";
import MarketIcon from "./MarketIcon";
import { isValidImageUrl } from "../utils/avatar";

/**
 * Renders a market's real icon image (from the data-api `icon` field) with
 * a deterministic category-gradient fallback when the image is missing or
 * fails to load. Never shows a broken image or the brand mark.
 */
export default function MarketImage({ icon, category, tag, size = 40, radius = 8 }) {
  const [failed, setFailed] = useState(false);
  const showImage = !failed && isValidImageUrl(icon);

  if (showImage) {
    return (
      <img
        src={icon}
        alt=""
        width={size}
        height={size}
        className="market-image"
        style={{ width: size, height: size, borderRadius: radius, objectFit: "cover" }}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return <MarketIcon category={category} tag={tag} size={size} radius={radius} />;
}