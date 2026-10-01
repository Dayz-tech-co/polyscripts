import { useEffect, useState } from "react";
import { Activity, BarChart3, BookOpen, Calendar, Database, LayoutGrid, PieChart, SearchX, Terminal, TrendingUp, Trophy, Wrench } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Filters from "../components/Filters";
import EmptyState from "../components/EmptyState";
import PageLoader from "../components/PageLoader";
import { getEcosystemResources } from "../services/ecosystemService";

const ICONS = {
  Database,
  Activity,
  Trophy,
  Calendar,
  BookOpen,
  Terminal,
  BarChart3,
  TrendingUp,
  Wrench,
  PieChart,
};

const CATEGORIES = ["All", "Analytics", "Data", "Research", "Developer Tools", "Education"];

export default function EcosystemPage() {
  const [resources, setResources] = useState(null);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    document.title = "Ecosystem | PolyScripts";
  }, []);

  useEffect(() => {
    let active = true;
    getEcosystemResources()
      .then((list) => {
        if (active) setResources(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (active) setResources([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible =
    resources == null
      ? null
      : category === "All"
        ? resources
        : resources.filter((r) => r.category === category);

  return (
    <main id="main-content" className="container main-content ecosystem-page">
      <PageHeader
        eyebrow="Directory"
        title="Ecosystem"
        description="Curated analytics, data and research tools around Polymarket."
      />

      <div className="tab-controls-row">
        <Filters options={CATEGORIES} active={category} onChange={setCategory} ariaLabel="Filter resources by category" />
      </div>

      {visible == null ? (
        <PageLoader compact label="Loading ecosystem" detail="Gathering public tools and APIs" />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchX} title="No resources in this category" />
      ) : (
        <div className="resource-grid">
          {visible.map((resource) => {
            const Icon = ICONS[resource.icon] || LayoutGrid;
            return (
              <article className="resource-card" key={resource.name}>
                <span className="capability-icon">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <div className="resource-card-body">
                  <div className="resource-card-title-row">
                    <h2 className="resource-card-title">{resource.name}</h2>
                    <span className={`status-pill ${resource.status === "Public" ? "status-open" : ""}`}>
                      {resource.status}
                    </span>
                  </div>
                  <p className="resource-card-description">{resource.description}</p>
                  <span className="resource-card-category">{resource.category}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
