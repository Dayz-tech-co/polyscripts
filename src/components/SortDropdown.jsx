import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function SortDropdown({ options, value, onChange, label = "Sort" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div className="sort-dropdown" ref={ref}>
      <button
        type="button"
        className="btn btn-secondary sort-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="sort-dropdown-label">{label}</span>
        <span>{value}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <ul className="sort-dropdown-menu" role="listbox">
          {options.map((option) => (
            <li key={option} role="option" aria-selected={value === option}>
              <button
                type="button"
                className={`sort-dropdown-item ${value === option ? "is-active" : ""}`}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
