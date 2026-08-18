import { useState } from "react";
import { getAvatarGradient, getInitials, isValidImageUrl } from "../utils/avatar";

/**
 * Renders an account's public avatar image, or a deterministic generated
 * placeholder (gradient + initials) when none exists or the image fails to
 * load. Never falls back to the PolyScripts brand mark - that belongs to
 * the site, not to any one trader.
 */
export default function Avatar({ account, size = 44, radius = 12 }) {
  const [failed, setFailed] = useState(false);
  const url = account?.avatar;
  const showImage = !failed && isValidImageUrl(url);

  if (showImage) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="account-avatar"
        style={{ width: size, height: size, borderRadius: radius, objectFit: "cover" }}
        onError={() => setFailed(true)}
      />
    );
  }

  const [from, to] = getAvatarGradient(account?.address || account?.username || account?.displayName);
  const initials = getInitials(account || {});

  return (
    <span
      className="account-avatar account-avatar-fallback"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize: Math.max(11, Math.round(size * 0.34)),
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
