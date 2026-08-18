import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, GitCompareArrows, LayoutGrid, LineChart, Search } from "lucide-react";
import PageHeader from "../components/PageHeader";

const TOOLS = [
  {
    to: "/checker",
    icon: Search,
    title: "Account Checker",
    description: "Inspect the analytics profile of a public demo account.",
    cta: "Open Checker",
  },
  {
    to: "/compare",
    icon: GitCompareArrows,
    title: "Compare Accounts",
    description: "Compare analytics from two demo profiles side by side.",
    cta: "Compare",
  },
  {
    to: "/leaderboard",
    icon: LineChart,
    title: "Performance Explorer",
    description: "Explore historical demo performance data and rankings.",
    cta: "Explore",
  },
  {
    to: "/ecosystem",
    icon: LayoutGrid,
    title: "Ecosystem Directory",
    description: "Browse curated analytics and research resources.",
    cta: "Browse",
  },
];

export default function ToolsPage() {
  useEffect(() => {
    document.title = "Tools | PolyScripts";
  }, []);

  return (
    <main id="main-content" className="container main-content">
      <PageHeader title="Tools" description="Analytics utilities for the demo ecosystem." />

      <div className="tool-grid">
        {TOOLS.map(({ to, icon: Icon, title, description, cta }) => (
          <Link key={to} to={to} className="tool-card">
            <span className="capability-icon">
              <Icon size={17} aria-hidden="true" />
            </span>
            <h2 className="tool-card-title">{title}</h2>
            <p className="tool-card-description">{description}</p>
            <span className="tool-card-cta">
              {cta}
              <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}