/**
 * Clean tab switch — active state on the button itself (no sliding ink bar).
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
  return (
    <div
      className={`seg-switch variant-${variant} size-${size}`}
      role="tablist"
      aria-label={ariaLabel}
    >
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
    </div>
  );
}
