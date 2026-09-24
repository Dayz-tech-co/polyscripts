import { useEffect, useRef, useState } from "react";

const DURATION = 900;
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t));

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Counts up to `value` on mount and tweens between values on change, then
 * flashes green/red for a moment so live updates are visible. Non-numeric
 * values render through `format` unchanged.
 */
export default function AnimatedNumber({ value, format = (v) => String(v), className = "" }) {
  const numeric = typeof value === "number" && Number.isFinite(value);
  const [display, setDisplay] = useState(() => (numeric && !reducedMotion() ? 0 : value));
  const [flash, setFlash] = useState("");
  const fromRef = useRef(numeric ? 0 : null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!numeric || reducedMotion()) {
      setDisplay(value);
      fromRef.current = numeric ? value : null;
      return undefined;
    }
    const from = fromRef.current ?? 0;
    if (mounted.current && from !== value) {
      setFlash(value > from ? "is-up" : "is-down");
    }
    mounted.current = true;
    const start = performance.now();
    let frame;
    const step = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      setDisplay(from + (value - from) * easeOutExpo(t));
      if (t < 1) frame = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    frame = requestAnimationFrame(step);
    const clear = setTimeout(() => setFlash(""), 1200);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(clear);
      fromRef.current = value;
    };
  }, [value, numeric]);

  return <span className={`anim-number ${flash} ${className}`}>{numeric ? format(display) : format(value)}</span>;
}
