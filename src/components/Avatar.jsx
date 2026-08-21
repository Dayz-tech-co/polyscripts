import { useState } from "react";
import { getAvatarColor, getInitials, isValidImageUrl } from "../utils/avatar";

/**
 * Account avatar or flat solid-color initials fallback (no gradients).
 */
export default function Avatar({ account, size = 40 }) {
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
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
        onError={() => setFailed(true)}
      />
    );
  }

  const color = getAvatarColor(account?.address || account?.username || account?.displayName);
  const initials = getInitials(account || {});

  return (
    <span
      className="account-avatar account-avatar-fallback"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        fontSize: Math.max(11, Math.round(size * 0.34)),
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
