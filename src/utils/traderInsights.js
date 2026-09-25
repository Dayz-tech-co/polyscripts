// Trader intelligence derived purely from a profile bundle that has already
// been fetched: Smart Score, behaviour badges and per-category edge. Every
// input is real public data; every output explains how it was computed so
// the UI can show its working instead of a black-box number.

const CATEGORY_RULES = [
  { key: "Esports", pattern: /\b(counter-strike|cs2|lol|league of legends|dota|valorant|esports)\b/i },
  { key: "Sports", pattern: /\b(vs\.?|win on|spread|o\/u|over\/under|halftime|exact score|both teams to score|clean sheet|1st half|first half|goalscorer|corners|total goals|innings|touchdowns?|nfl|nba|mlb|nhl|ufc|fc\b|premier league|champions league|la liga|serie a|tennis|grand prix|f1|world cup|super bowl|playoffs|mvp)\b/i },
  { key: "Crypto", pattern: /\b(bitcoin|btc|ethereum|eth|solana|sol|xrp|doge|crypto|up or down|hyperliquid|memecoin|token|fdv|airdrop)\b/i },
  { key: "Politics", pattern: /\b(election|president|trump|biden|senate|house|democrat|republican|nominee|governor|mayor|parliament|prime minister|vote|primary|cabinet|impeach)\b/i },
  { key: "Economics", pattern: /\b(fed|interest rate|cpi|inflation|gdp|recession|unemployment|jobs report|rate cut|rate hike|treasury|tariff)\b/i },
  { key: "Tech", pattern: /\b(openai|gpt|ai\b|apple|google|tesla|nvidia|spacex|iphone)\b/i },
  { key: "Culture", pattern: /\b(oscar|grammy|movie|album|box office|celebrity|taylor swift|tweet|mention|youtube|netflix|emmy)\b/i },
];

export function classifyMarket(title = "") {
  // Parlay markets join several legs with " AND ".
  if (/ AND /.test(title)) return "Combos";
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(title)) return rule.key;
  }
  return "Other";
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Per-category record over resolved positions. */
export function categoryEdge(resolvedPositions = []) {
  const groups = new Map();
  for (const p of resolvedPositions) {
    if (p.pnl == null || !Number.isFinite(p.pnl)) continue;
    const key = classifyMarket(p.market);
    const g = groups.get(key) || { category: key, count: 0, wins: 0, pnl: 0, invested: 0 };
    g.count += 1;
    if (p.pnl >= 0) g.wins += 1;
    g.pnl += p.pnl;
    g.invested += p.invested || 0;
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, winRate: g.count ? g.wins / g.count : null, roi: g.invested > 0 ? g.pnl / g.invested : null }))
    .sort((a, b) => b.count - a.count);
}

/** Month-over-month changes of the official cumulative PnL series. */
function monthlyConsistency(pnlSeries = []) {
  const monthEnd = new Map();
  for (const point of pnlSeries) {
    if (!point?.date || !Number.isFinite(point.value)) continue;
    monthEnd.set(point.date.slice(0, 7), point.value);
  }
  const values = [...monthEnd.values()];
  const deltas = values.slice(1).map((v, i) => v - values[i]);
  if (deltas.length < 3) return null;
  return { months: deltas.length, profitable: deltas.filter((d) => d > 0).length };
}

const GRADES = [
  { min: 60, label: "Elite" },
  { min: 30, label: "Strong" },
  { min: -10, label: "Average" },
  { min: -40, label: "Weak" },
  { min: -Infinity, label: "Poor" },
];

/** Best available all-time PnL: the profile's official total, then leaderboard, then series. */
export function allTimePnl({ stats, account, pnlSeries = [] }) {
  if (Number.isFinite(stats?.pnl)) return stats.pnl;
  if (Number.isFinite(account?.pnl)) return account.pnl;
  const last = pnlSeries[pnlSeries.length - 1];
  if (last && Number.isFinite(last.value)) return last.value;
  return stats?.realizedPnl ?? null;
}

/**
 * Smart Score in [-100, 100] from four transparent components:
 * profitability (official all-time PnL), edge (PnL per dollar traded),
 * win rate (resolved positions, scaled by sample size) and consistency
 * (share of profitable months in the official PnL history).
 */
export function computeSmartScore({ stats, account, resolvedPositions = [], pnlSeries = [] }) {
  const known = resolvedPositions.filter((p) => p.pnl != null && Number.isFinite(p.pnl));
  const n = known.length;
  const pnl = allTimePnl({ stats, account, pnlSeries });
  if (!stats || pnl == null || (n < 10 && pnlSeries.length < 30)) {
    return { score: null, sample: n, components: [], grade: null };
  }

  const confidence = Math.min(1, n / 50);
  const winRate = n ? known.filter((p) => p.pnl >= 0).length / n : null;
  const volume = stats.volume;
  const edge = volume > 0 ? pnl / volume : null;
  const consistency = monthlyConsistency(pnlSeries);

  const components = [
    {
      key: "profit",
      label: "Profitability",
      max: 35,
      value: Math.sign(pnl) * Math.min(35, Math.log10(1 + Math.abs(pnl) / 100) * 7),
      note: "All-time PnL, log-scaled",
    },
    {
      key: "edge",
      label: "Edge per trade",
      max: 25,
      value: edge != null ? clamp(edge * 500, -25, 25) : 0,
      note: edge != null ? `${(edge * 100).toFixed(2)}% PnL per $1 traded` : "No volume data",
    },
    {
      key: "winrate",
      label: "Win rate",
      max: 25,
      value: winRate != null ? clamp((winRate - 0.5) * 100, -25, 25) * confidence : 0,
      note: winRate != null ? `${Math.round(winRate * 100)}% over the last ${n.toLocaleString("en-US")} resolved positions` : "No resolved positions",
    },
    {
      key: "consistency",
      label: "Consistency",
      max: 15,
      value: consistency ? clamp((consistency.profitable / consistency.months - 0.5) * 30, -15, 15) : 0,
      note: consistency ? `${consistency.profitable} of ${consistency.months} months profitable` : "Fewer than 3 months of history",
    },
  ].map((c) => ({ ...c, value: Math.round(c.value) }));

  const score = clamp(components.reduce((s, c) => s + c.value, 0), -100, 100);
  return { score, sample: n, pnl, components, grade: GRADES.find((g) => score >= g.min).label };
}

function tradeTimestamps(activity = []) {
  return activity
    .filter((a) => a.rawType === "TRADE" && a.timestamp)
    .map((a) => a.timestamp)
    .sort((a, b) => a - b);
}

function looksAutomated(activity) {
  // One large order fills as many trades in the same second; count distinct
  // seconds so big manual orders don't look automated.
  const ts = [...new Set(tradeTimestamps(activity).map((t) => Math.floor(t / 1000) * 1000))];
  if (ts.length < 150) return false;
  const gaps = [];
  for (let i = 1; i < ts.length; i += 1) gaps.push(ts[i] - ts[i - 1]);
  gaps.sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)];
  let burst = 0;
  for (let i = 0, j = 0; i < ts.length; i += 1) {
    while (ts[i] - ts[j] > 60 * 60 * 1000) j += 1;
    burst = Math.max(burst, i - j + 1);
  }
  return median < 30_000 || burst >= 120;
}

/** Behaviour badges, each with the rule that produced it. */
export function computeBadges({ stats, account, resolvedPositions = [], activity = [], pnlSeries = [] }) {
  if (!stats) return [];
  const badges = [];
  const n = resolvedPositions.filter((p) => p.pnl != null).length;
  const pnl = allTimePnl({ stats, account, pnlSeries }) ?? 0;

  if ((stats.portfolioValue ?? 0) >= 100_000 || (stats.volume ?? 0) >= 10_000_000) {
    badges.push({ key: "whale", label: "Whale", tone: "brand", hint: "Portfolio ≥ $100K or lifetime volume ≥ $10M" });
  }
  if ((stats.avgPositionSize ?? 0) >= 10_000) {
    badges.push({ key: "roller", label: "High roller", tone: "brand", hint: "Average position ≥ $10K" });
  }
  if ((stats.winRate ?? 0) >= 0.6 && n >= 30 && pnl > 0) {
    badges.push({ key: "consistent", label: "Consistent winner", tone: "positive", hint: "Win rate ≥ 60% over 30+ resolved positions and profitable all-time" });
  }
  if (stats.volume > 0 && pnl / stats.volume >= 0.05 && pnl >= 50_000) {
    badges.push({ key: "sharp", label: "Sharp", tone: "positive", hint: "All-time PnL ≥ 5% of volume traded and ≥ $50K" });
  }
  if (pnl >= 1_000_000) {
    badges.push({ key: "millionaire", label: "$1M+ profit", tone: "positive", hint: "All-time PnL of $1M or more" });
  }
  if (looksAutomated(activity)) {
    badges.push({ key: "bot", label: "Likely bot", tone: "info", hint: "Median gap between trades < 30s, or 120+ trades within one hour" });
  }
  const ts = tradeTimestamps(activity);
  const firstSeen = ts[0];
  if ((stats.marketsTraded ?? Infinity) <= 10 && firstSeen && Date.now() - firstSeen < 30 * 24 * 60 * 60 * 1000) {
    badges.push({ key: "fresh", label: "Fresh wallet", tone: "warn", hint: "10 or fewer markets traded, first trade within 30 days" });
  }
  if ((stats.marketsTraded ?? 0) >= 1000) {
    badges.push({ key: "veteran", label: "Market veteran", tone: "info", hint: "1,000+ markets traded" });
  }
  const edge = categoryEdge(resolvedPositions).filter((g) => g.category !== "Other");
  const top = edge[0];
  if (top && n >= 20 && top.count / n >= 0.6) {
    badges.push({ key: "specialist", label: `${top.category} specialist`, tone: "info", hint: `${Math.round((top.count / n) * 100)}% of resolved positions are ${top.category}` });
  }
  if (pnl < -10_000 && (stats.winRate ?? 1) < 0.45 && n >= 20) {
    badges.push({ key: "fade", label: "Fade candidate", tone: "negative", hint: "Win rate < 45% and all-time losses > $10K" });
  }
  return badges;
}
