import { Download, LoaderCircle } from "lucide-react";
import { downloadProfileCsv } from "../utils/exportProfile";
import { useToast } from "../context/toast";

export default function ProfileActions({ data, loading }) {
  const { showToast } = useToast();

  function handleExport() {
    downloadProfileCsv(data);
    showToast("Profile CSV downloaded");
  }

  return (
    <div className="profile-data-actions" aria-label="Profile data actions">
      <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={loading || !data}>
        {loading ? <LoaderCircle size={13} className="spin" aria-hidden="true" /> : <Download size={13} aria-hidden="true" />}
        <span>{loading ? "Preparing export" : "Export CSV"}</span>
      </button>
    </div>
  );
}
