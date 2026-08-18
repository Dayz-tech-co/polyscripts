import { useId, useState } from "react";

/**
 * Lightweight tooltip wrapper. Wraps a single focusable/interactive child
 * and shows a small dark label on hover or keyboard focus.
 */
export default function Tooltip({ label, children, position = "top" }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <span role="tooltip" id={id} className={`tooltip tooltip-${position} ${visible ? "is-visible" : ""}`}>
        {label}
      </span>
    </span>
  );
}
