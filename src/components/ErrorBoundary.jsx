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

  // Navigating to another page clears the error.
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
        <div className="error-state">
          <p className="error-state-title">This page hit an unexpected error</p>
          <p className="empty-state-description">The rest of PolyScripts still works. Try reloading this page.</p>
          <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
            <RefreshCw size={14} aria-hidden="true" />
            <span>Reload</span>
          </button>
        </div>
      </main>
    );
  }
}
