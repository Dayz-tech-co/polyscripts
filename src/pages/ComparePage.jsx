import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GitCompareArrows, Link2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import CompareSelect from "../components/CompareSelect";
import PerformanceChart from "../components/PerformanceChart";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import { TableSkeleton } from "../components/Skeleton";
import { getCompare } from "../services/ecosystemService";
import { resolveIdentifier } from "../services/polymarketService";
import { shortenAddress } from "../utils/address";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercentage, formatSignedCurrency } from "../utils/formatters";
import { getValueState } from "../utils/states";
import { useToast } from "../context/ToastContext";

const METRIC_ROWS = [
  { key: "pnl", label: "P&L" },
  { key: "volume", label: "Volume" },
  { key: "winRate", label: "Win Rate" },
  { key: "markets", label: "Markets" },
  { key: "portfolioValue", label: "Current Value" },
  { key: "activityCount", label: "Activity Count" },
  { key: "openPositions", label: "Open Positions" },
];

function formatMetric(key, value) {
  switch (key) {
    case "pnl":
      return formatSignedCurrency(value);
    case "volume":
      return formatCompactCurrency(value);
    case "winRate":
      return formatPercentage(value);
    case "markets":
    case "activityCount":
    case "openPositions":
      return formatNumber(value);
    case "portfolioValue":
      return formatCurrency(value);
    default:
      return formatNumber(value);
  }
}

function metricTone(key, value) {
  if (key === "pnl") return getValueState(value);
  return undefined;
}

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const addressA = a?.address || "";
  const addressB = b?.address || "";

  useEffect(() => {
    document.title = "Compare Accounts | PolyScripts";
  }, []);

  // Shared comparison links can prefill either or both selectors.
  useEffect(() => {
    const seedA = (searchParams.get("a") || "").trim();
    const seedB = (searchParams.get("b") || "").trim();
    if (!seedA && !seedB) return undefined;
    let cancelled = false;
    Promise.all([
      seedA ? resolveIdentifier(seedA).catch(() => null) : null,
      seedB ? resolveIdentifier(seedB).catch(() => null) : null,
    ]).then(([accountA, accountB]) => {
      if (cancelled) return;
      if (accountA) setA((current) => current?.address === accountA.address ? current : accountA);
      if (accountB) setB((current) => current?.address === accountB.address ? current : accountB);
    });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!addressA && !addressB) return;
    if ((searchParams.get("a") || "") === addressA && (searchParams.get("b") || "") === addressB) return;
    const next = new URLSearchParams(searchParams);
    if (addressA) next.set("a", addressA);
    if (addressB) next.set("b", addressB);
    setSearchParams(next, { replace: true });
  }, [addressA, addressB, searchParams, setSearchParams]);

  async function handleShareComparison() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Comparison link copied");
    } catch {
      showToast("Unable to copy comparison link");
    }
  }

  useEffect(() => {
    if (!a || !b) {
      setResult(null);
      return undefined;
    }
    let active = true;
    setLoading(true);
    getCompare(a.address, b.address).then((data) => {
      if (!active) return;
      setResult(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [a, b]);

  const ready = result && a && b;

  return (
    <main id="main-content" className="container main-content">
      <PageHeader title="Compare Accounts" description="Compare analytics from two public accounts side by side." />

      <div className="compare-selectors">
        <CompareSelect label="Account A" value={a} onSelect={setA} />
        <span className="compare-vs" aria-hidden="true">
          <GitCompareArrows size={18} />
        </span>
        <CompareSelect label="Account B" value={b} onSelect={setB} />
      </div>

      {a && b && (
        <div className="compare-actions">
          <button type="button" className="btn btn-secondary" onClick={handleShareComparison}>
            <Link2 size={13} aria-hidden="true" />
            <span>Copy comparison link</span>
          </button>
        </div>
      )}

      {!ready ? (
        loading ? (
          <TableSkeleton rows={8} />
        ) : (
          <EmptyState icon={GitCompareArrows} title="Select two accounts to compare" description="Pick an account on each side to view neutral side by side analytics." />
        )
      ) : (
        <>
          <div className="compare-grid">
            <div className="compare-column">
              <div className="compare-account-head">
                <Avatar account={result.a.account} size={40} radius={10} />
                <span className="account-cell-text">
                  <span className="account-cell-name">{result.a.account.username || result.a.account.displayName || shortenAddress(result.a.account.address)}</span>
                  <span className="account-cell-address">{shortenAddress(result.a.account.address)}</span>
                </span>
              </div>
            </div>
            <div className="compare-column">
              <div className="compare-account-head">
                <Avatar account={result.b.account} size={40} radius={10} />
                <span className="account-cell-text">
                  <span className="account-cell-name">{result.b.account.username || result.b.account.displayName || shortenAddress(result.b.account.address)}</span>
                  <span className="account-cell-address">{shortenAddress(result.b.account.address)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="compare-metrics">
            {METRIC_ROWS.map(({ key, label }) => (
              <div className="compare-metric-row" key={key}>
                <span className="compare-metric-label">{label}</span>
                <span className={`compare-metric-value tone-${metricTone(key, result.a.metrics[key])}`}>{formatMetric(key, result.a.metrics[key])}</span>
                <span className={`compare-metric-value tone-${metricTone(key, result.b.metrics[key])}`}>{formatMetric(key, result.b.metrics[key])}</span>
              </div>
            ))}
          </div>

          <div className="compare-charts">
            <div className="card performance-card">
              <div className="performance-header">
                <div>
                  <span className="card-label">{result.a.account.username || result.a.account.displayName || shortenAddress(result.a.account.address)}</span>
                  <div className="performance-change">
                    <span>All-time realized PnL</span>
                  </div>
                </div>
              </div>
              <PerformanceChart data={result.a.performance} metric="performance" range="ALL" startValue={result.a.perfRange?.startValue ?? 0} />
            </div>
            <div className="card performance-card">
              <div className="performance-header">
                <div>
                  <span className="card-label">{result.b.account.username || result.b.account.displayName || shortenAddress(result.b.account.address)}</span>
                  <div className="performance-change">
                    <span>All-time realized PnL</span>
                  </div>
                </div>
              </div>
              <PerformanceChart data={result.b.performance} metric="performance" range="ALL" startValue={result.b.perfRange?.startValue ?? 0} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
