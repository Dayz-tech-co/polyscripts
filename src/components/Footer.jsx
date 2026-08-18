export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span className="footer-brand">PolyScripts</span>
        <nav className="footer-links" aria-label="Footer">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="https://x.com" target="_blank" rel="noreferrer noopener">
            X
          </a>
          <a href="#docs">Documentation</a>
        </nav>
      </div>
    </footer>
  );
}
