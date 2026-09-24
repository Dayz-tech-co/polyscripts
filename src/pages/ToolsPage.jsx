import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Bookmark, CandlestickChart, Gift, GitCompareArrows, LayoutGrid, LineChart, Scale, Search, Waves } from "lucide-react";
import PageHeader from "../components/PageHeader";

const TOOLS = [
  {
    to: "/whales",
    icon: Waves,
    title: "Whale Tracker",
    description: "Live feed of large trades with fresh-wallet, long-shot and insider signals.",
    cta: "Track whales",
  },
  {
    to: "/arbitrage",
    icon: Scale,
    title: "Arbitrage Scanner",
    description: "Multi-outcome events whose prices don't add up to $1, rescanned every 30 seconds.",
    cta: "Scan now",
  },
  {
    to: "/markets",
    icon: CandlestickChart,
    title: "Market Explorer",
    description: "Live odds, biggest movers, price history and the smart-money lean on every market.",
    cta: "Explore markets",
  },
  {
    to: "/watchlist",
    icon: Bookmark,
    title: "Watchlist Feed",
    description: "One timeline of trades from every wallet you follow, with browser alerts.",
    cta: "Open feed",
  },
  {
    to: "/rewards",
    icon: Gift,
    title: "Rewards Studio",
    description: "Explore public reward activity and create shareable trader cards.",
    cta: "Open Rewards",
  },
  {
    to: "/checker",
    icon: Search,
    title: "Account Checker",
    description: "Inspect the analytics profile of any public account.",
    cta: "Open Checker",
  },
  {
    to: "/compare",
    icon: GitCompareArrows,
    title: "Compare Accounts",
    description: "Compare analytics from two public accounts side by side.",
    cta: "Compare",
  },
  {
    to: "/leaderboard",
    icon: LineChart,
    title: "Performance Explorer",
    description: "Explore historical performance data and rankings.",
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
      <PageHeader title="Tools" description="Analytics utilities for the Polymarket ecosystem." />

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
