import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span className="footer-brand">PolyScripts</span>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/tools">Tools</Link>
          <Link to="/ecosystem">Ecosystem</Link>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </nav>
      </div>
      <div className="container footer-note">
        Demo data only. Not financial advice. Read only analytics - no trading, wallets or deposits.
      </div>
    </footer>
  );
}