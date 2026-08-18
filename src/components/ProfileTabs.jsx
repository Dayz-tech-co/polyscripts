const TABS = ["Overview", "Positions", "Activity", "History"];

export default function ProfileTabs({ active, onChange }) {
  return (
    <div className="profile-tabs" role="tablist" aria-label="Profile sections">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          id={`tab-${tab.toLowerCase()}`}
          aria-selected={active === tab}
          aria-controls={`panel-${tab.toLowerCase()}`}
          className={`tab-btn ${active === tab ? "is-active" : ""}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
