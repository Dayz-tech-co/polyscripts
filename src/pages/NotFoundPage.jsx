import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = "Page not found | PolyScripts";
  }, []);

  return (
    <main id="main-content" className="container main-content">
      <div className="status-page">
        <Compass size={28} strokeWidth={1.5} className="status-page-icon" aria-hidden="true" />
        <h1 className="status-page-title">Page not found</h1>
        <p className="status-page-description">This page doesn&apos;t exist. Search for a public account instead.</p>
        <div className="status-page-actions">
          <Link to="/" className="btn btn-primary">
            <Home size={14} aria-hidden="true" />
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
