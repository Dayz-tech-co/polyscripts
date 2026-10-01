import { Component } from "react";
import { RefreshCw } from "lucide-react";

/** Keeps one broken component from blanking the whole app. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main id="main-content" className="container main-content">
        <div className="soft-error">
          <span className="soft-error-orb" aria-hidden="true" />
          <h1>Something went sideways</h1>
          <p>This view crashed, but the rest of PolyScripts is fine. Reload and you should be back.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            <RefreshCw size={14} aria-hidden="true" />
            <span>Reload page</span>
          </button>
        </div>
      </main>
    );
  }
}
