// Centralized formatting helpers so number/date/text formatting logic
// is not duplicated across components.

export { shortenAddress } from "./address";

/**
 * 84291.42 -> "$84,291.42"
 */
export function formatCurrency(value, options = {}) {
  const { decimals = 2 } = options;
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * 84291.42 -> "+$84,291.42" / -12.5 -> "-$12.50"
 */
export function formatSignedCurrency(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatCurrency(Math.abs(value), options)}`;
}

/**
 * 426800 -> "$426.8K"
 * 1850000 -> "$1.85M"
 */
export function formatCompactCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

/**
 * 0.284 -> "28.4%"  (value expected as a decimal fraction)
 */
export function formatPercentage(value, options = {}) {
  const { decimals = 1, signed = false } = options;
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  const pct = value * 100;
  const prefix = signed && pct > 0 ? "+" : "";
  return `${prefix}${pct.toFixed(decimals)}%`;
}

/**
 * 0.62 -> "62¢"
 * 1 -> "$1.00"
 */
export function formatPrice(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `${Math.round(value * 100)}¢`;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Given an ISO timestamp or Date, returns a compact relative label
 * such as "2h ago", "5m ago", "3d ago".
 */
export function formatTimeAgo(timestamp, now = new Date()) {
  const then = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const diff = now.getTime() - then.getTime();
  if (Number.isNaN(diff)) return "";
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(timestamp) {
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Compact date without year, for chart axis labels: 2026-08-19 -> "Aug 19" */
export function formatDateShort(timestamp) {
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return value.toLocaleString("en-US");
}
