const TABS = ["Overview", "Positions", "Activity", "History"];
const COUNT_FORMATTER = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export default function ProfileTabs({ active, onChange, counts = {} }) {
  function handleKeyDown(event, currentIndex) {
    let nextIndex = null;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % TABS.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TABS.length - 1;
    if (nextIndex == null) return;

    event.preventDefault();
    onChange(TABS[nextIndex]);
    event.currentTarget.parentElement?.children[nextIndex]?.focus();
  }

  return (
    <div className="profile-tabs" role="tablist" aria-label="Profile sections">
      {TABS.map((tab, index) => (
        <button
          key={tab}
          type="button"
          role="tab"
          id={`tab-${tab.toLowerCase()}`}
          aria-selected={active === tab}
          aria-controls={`panel-${tab.toLowerCase()}`}
          tabIndex={active === tab ? 0 : -1}
          className={`tab-btn ${active === tab ? "is-active" : ""}`}
          onClick={() => onChange(tab)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          <span>{tab}</span>
          {counts[tab] != null && (
            <span className="tab-count" title={`${counts[tab].toLocaleString()} items`}>
              {COUNT_FORMATTER.format(counts[tab])}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
