import { RefreshCw } from "lucide-react";

export default function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <div className="error-state">
      <p className="error-state-title">{title}</p>
      {description && <p className="empty-state-description">{description}</p>}
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden="true" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
