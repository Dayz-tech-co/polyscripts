export default function Filters({ options, active, onChange, ariaLabel }) {
  return (
    <div className="filters-row" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`filter-btn ${active === option ? "is-active" : ""}`}
          onClick={() => onChange(option)}
          aria-pressed={active === option}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
