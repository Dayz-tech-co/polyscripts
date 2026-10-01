/**
 * Underline / pill tab switch with springy ink.
 * Options: { value, label, icon? }
 */
export default function SegmentControl({
  options,
  value,
  onChange,
  ariaLabel = "Options",
  size = "md",
  variant = "underline",
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const count = Math.max(1, options.length);

  return (
    <div
      className={`seg-switch variant-${variant} size-${size}`}
      role="tablist"
      aria-label={ariaLabel}
      style={{ "--seg-count": count, "--seg-index": index }}
    >
      {variant === "pill" ? <span className="seg-switch-pill" aria-hidden="true" /> : null}
      {options.map((opt) => {
        const active = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`seg-switch-btn ${active ? "is-active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {Icon ? <Icon size={13} aria-hidden="true" /> : null}
            <span>{opt.label}</span>
          </button>
        );
      })}
      {variant === "underline" ? <span className="seg-switch-ink" aria-hidden="true" /> : null}
    </div>
  );
}
