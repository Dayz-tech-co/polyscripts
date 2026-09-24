import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span className="footer-brand">PolyScripts</span>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/markets">Markets</Link>
          <Link to="/whales">Whales</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/tools">Tools</Link>
          <Link to="/ecosystem">Ecosystem</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </div>
      <div className="container footer-note">
        Independent read-only analytics, not affiliated with Polymarket. Signals are automated and may be wrong. Not financial advice.
      </div>
    </footer>
  );
}