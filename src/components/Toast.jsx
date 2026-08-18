import { CheckCircle2 } from "lucide-react";
import { useToast } from "../context/ToastContext";

export default function Toast() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast" onClick={() => dismissToast(toast.id)}>
          <CheckCircle2 size={15} className="toast-icon" aria-hidden="true" />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
