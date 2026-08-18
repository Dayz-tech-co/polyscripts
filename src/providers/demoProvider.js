// Demo provider - the single source of truth for every piece of market and
// account data shown in the PolyScripts demo UI. Nothing here is real: it is
// a normalized, internally consistent mock dataset so the profile page, the
// leaderboard, the dashboard and the comparison tool all render the exact
// same numbers for the same account.
//
// Every UI consumer should go through the service layer (polymarketService,
// profileService, ecosystemService) rather than importing this module
// directly. The values in ROSTER are canonical: leaderboard rows, profile
// stats and compare results all derive from them, so no two surfaces can
// ever contradict one another.

const DAY = 24 * 60 * 60 * 1000;

const ROSTER = [
  {
    username: "swisstony",
    displayName: "Frail-Possible",
    address: "0x204f72f35326db932158cba6adff0b9a1da95e14",
    verified: false,
    pnl: 22400,
    volume: 720000,
    winRate: 0.67,
    markets: 34,
    portfolioValue: 48600,
    openPositions: 5,
    activityCount: 46,
    bio: "Watching macro and crypto markets. Demo profile data.",
    tierName: "Bronze",
  },
  {
    username: "ferrariChampions2026",
    displayName: "Bold-Circuit",
    address: "0xfe787d2da716d60e8acff57fb87eb13cd4d10319",
    verified: false,
    pnl: 31250,
    volume: 1180000,
    winRate: 0.61,
    markets: 52,
    portfolioValue: 74000,
    openPositions: 7,
    activityCount: 58,
    bio: "Sports markets focused. Demo profile data.",
    tierName: "Silver",
  },
  {
    username: "HomeRunHazard",
    displayName: "Quiet-Diamond",
    address: "0x5268527977f700f9bf9b6d5cd843859e4e70135d",
    verified: true,
    pnl: 15400,
    volume: 465000,
    winRate: 0.72,
    markets: 28,
    portfolioValue: 33200,
    openPositions: 4,
    activityCount: 39,
    bio: "Small edge hunting across the majors. Demo profile data.",
    tierName: "Silver",
  },
  {
    username: "swisstony8",
    displayName: "Jaded-Feed",
    address: "0x19a644960679f35b7adbbc5dc56a2000b1cf5a80",
    verified: false,
    pnl: -8300,
    volume: 218000,
    winRate: 0.44,
    markets: 19,
    portfolioValue: 12600,
    openPositions: 3,
    activityCount: 27,
    bio: "Testing short-term momentum ideas. Demo profile data.",
    tierName: null,
  },
  {
    username: null,
    displayName: "Silent-Ledger",
    address: "0x3048d65321be3497164cdfc2996f94f98a2e7537",
    verified: false,
    pnl: 9800,
    volume: 392000,
    winRate: 0.58,
    markets: 26,
    portfolioValue: 28800,
    openPositions: 4,
    activityCount: 33,
    bio: "Quiet book, steady accumulation. Demo profile data.",
    tierName: "Bronze",
  },
  {
    username: "RWCS",
    displayName: "Steady-Signal",
    address: "0x4ab9b54427ec4b7f3646b1a0ef1bed73bc708ebe",
    verified: true,
    pnl: 48000,
    volume: 1540000,
    winRate: 0.66,
    markets: 61,
    portfolioValue: 96200,
    openPositions: 8,
    activityCount: 71,
    bio: "High volume systematic style. Demo profile data.",
    tierName: "Gold",
  },
  {
    username: "AlphaPrime",
    displayName: "Neon-Contour",
    address: "0xe076cfe49361ef077d6654a947947bb669f6f776",
    verified: false,
    pnl: -12600,
    volume: 310000,
    winRate: 0.39,
    markets: 22,
    portfolioValue: 9800,
    openPositions: 2,
    activityCount: 25,
    bio: "Aggressive sizing, mixed results. Demo profile data.",
    tierName: null,
  },
  {
    username: "marketWizard",
    displayName: "Mild-Flare",
    address: "0x23b81874948a74f87e2852d17cda20c9ce334bc6",
    verified: true,
    pnl: 27400,
    volume: 890000,
    winRate: 0.64,
    markets: 47,
    portfolioValue: 58200,
    openPositions: 6,
    activityCount: 54,
    bio: "Event driven across politics and macro. Demo profile data.",
    tierName: "Silver",
  },
  {
    username: "thetaGambler",
    displayName: "Drift-Index",
    address: "0x72ee2f3443f8500a7eac80626f5563f3eab62589",
    verified: false,
    pnl: 6900,
    volume: 245000,
    winRate: 0.55,
    markets: 31,
    portfolioValue: 19800,
    openPositions: 5,
    activityCount: 30,
    bio: "Scaling in early on longer horizons. Demo profile data.",
    tierName: "Bronze",
  },
  {
    username: "ZeroSumHero",
    displayName: "Clear-Optics",
    address: "0x613227d435f39282a9f93daf65b70f67fd6fd9e3",
    verified: false,
    pnl: 17800,
    volume: 640000,
    winRate: 0.7,
    markets: 40,
    portfolioValue: 41400,
    openPositions: 5,
    activityCount: 48,
    bio: "Consistent winner with tight risk. Demo profile data.",
    tierName: "Bronze",
  },
  {
    username: "CascadeRunner",
    displayName: "Quiet-Volt",
    address: "0x1178768a9954c76cadb7cc659ff00af6cee49fa8",
    verified: false,
    pnl: -2400,
    volume: 176000,
    winRate: 0.47,
    markets: 16,
    portfolioValue: 15200,
    openPositions: 3,
    activityCount: 22,
    bio: "Small book, mean reversion plays. Demo profile data.",
    tierName: null,
  },
  {
    username: "VegaSplitter",
    displayName: "Crisp-Margin",
    address: "0x926943b84f5cbbcc57c66065d0b3a4367737987f",
    verified: true,
    pnl: 36500,
    volume: 1320000,
    winRate: 0.63,
    markets: 55,
    portfolioValue: 81100,
    openPositions: 7,
    activityCount: 63,
    bio: "Structure and volatility focused. Demo profile data.",
    tierName: "Gold",
  },
];

const MARKET_TITLES = [
  { title: "Will Bitcoin close above $100K this year?", slug: "btc-100k-eoy", category: "Crypto" },
  { title: "Fed cuts rates at the next meeting?", slug: "fed-rate-cut-next", category: "Economy" },
  { title: "Will the Lakers make the playoffs?", slug: "lakers-playoffs", category: "Sports" },
  { title: "Ethereum above $5,000 before year end?", slug: "eth-5k-eoy", category: "Crypto" },
  { title: "Will Congress pass the bill by year end?", slug: "congress-bill-eoy", category: "Politics" },
  { title: "AI chip supply keeps growing this quarter?", slug: "ai-chip-supply-q", category: "Tech" },
  { title: "Will it snow in NYC this weekend?", slug: "nyc-snow-weekend", category: "Weather" },
  { title: "Inflation cools below target by March?", slug: "inflation-below-target", category: "Economy" },
];

const CATEGORY_MARKETS = {
  Crypto: 18,
  Politics: 14,
  Economy: 9,
  Sports: 11,
  Weather: 4,
  Tech: 7,
  Business: 5,
};

const ECOSYSTEM_RESOURCES = [
  { name: "Gamma API", category: "Data", description: "Event, market and profile lookups for the whole Polymarket universe.", icon: "Database", status: "Public" },
  { name: "Data API", category: "Data", description: "Positions, activity, value and traded market endpoints for public accounts.", icon: "Activity", status: "Public" },
  { name: "Leaderboard API", category: "Analytics", description: "Ranked accounts by volume and profit across configurable time windows.", icon: "Trophy", status: "Public" },
  { name: "Market Calendars", category: "Research", description: "Upcoming event calendars and resolution schedules for active markets.", icon: "Calendar", status: "Demo" },
  { name: "Strategy Guides", category: "Education", description: "Walkthroughs of position building, spreads and market structure.", icon: "BookOpen", status: "Demo" },
  { name: "Python SDK", category: "Developer Tools", description: "Client library for querying public market and account data programmatically.", icon: "Terminal", status: "Demo" },
  { name: "Volume Screener", category: "Analytics", description: "Surfaces the most actively traded markets and recent volume shifts.", icon: "BarChart3", status: "Demo" },
  { name: "Outcome Tracker", category: "Research", description: "Tracks resolution outcomes and historical win rates across categories.", icon: "TrendingUp", status: "Demo" },
  { name: "CLI Explorer", category: "Developer Tools", description: "Terminal tool for fast account and position lookups.", icon: "Wrench", status: "Demo" },
  { name: "Category Reports", category: "Analytics", description: "Aggregated performance breakdowns by market category.", icon: "PieChart", status: "Demo" },
];

const PERIOD_MULTIPLIERS = {
  DAY: [0.04, 0.32],
  WEEK: [0.16, 0.6],
  MONTH: [0.42, 0.88],
  ALL: [1, 1],
};

function hashString(value) {
  let hash = 0;
  const str = String(value || "seed");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function seededAccount(account) {
  const seed = hashString(account.address);
  return {
    ...account,
    _seed: seed,
    unrealizedPnl: round2(account.pnl * 0.55),
    realizedPnl: round2(account.pnl * 0.45),
    resolvedPositions: Math.max(4, Math.round(account.markets * 0.45)),
  };
}

function allAccounts() {
  return ROSTER.map(seededAccount);
}

function normalizeIdentifier(identifier) {
  return String(identifier || "").trim().toLowerCase();
}

export function getAccount(identifier) {
  const key = normalizeIdentifier(identifier);
  if (!key) return null;
  const account = ROSTER.find(
    (a) => a.address.toLowerCase() === key || (a.username && a.username.toLowerCase() === key) || (a.displayName && a.displayName.toLowerCase() === key)
  );
  return account ? seededAccount(account) : null;
}

export function getAccountByAddress(address) {
  const key = normalizeIdentifier(address);
  if (!key) return null;
  const account = ROSTER.find((a) => a.address.toLowerCase() === key);
  return account ? seededAccount(account) : null;
}

export function searchAccounts(query) {
  const q = normalizeIdentifier(query);
  if (!q) return [];
  const exact = ROSTER.filter((a) => {
    if (a.username && a.username.toLowerCase() === q) return true;
    if (a.displayName && a.displayName.toLowerCase() === q) return true;
    if (a.address.toLowerCase() === q) return true;
    return false;
  });
  const partial = ROSTER.filter((a) => {
    if (a.username && a.username.toLowerCase().includes(q)) return true;
    if (a.displayName && a.displayName.toLowerCase().includes(q)) return true;
    if (a.address.toLowerCase().includes(q)) return true;
    return false;
  });
  return dedupeById([...exact, ...partial]).map(seededAccount);
}

function dedupeById(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (seen.has(item.address)) continue;
    seen.add(item.address);
    out.push(item);
  }
  return out;
}

export function getLeaderboard({ metric = "pnl", period = "ALL", limit = 25 } = {}) {
  const accounts = allAccounts().map((account) => {
    const [lo, hi] = PERIOD_MULTIPLIERS[period] || PERIOD_MULTIPLIERS.ALL;
    const rand = mulberry32(hashString(account.address + period));
    const factor = lo + rand() * (hi - lo);
    const scaledPnl = round2(account.pnl * factor);
    const scaledVolume = round2(account.volume * factor);
    return {
      account,
      pnl: scaledPnl,
      volume: scaledVolume,
      winRate: account.winRate,
      markets: account.markets,
    };
  });

  const sortKey = metric === "volume" ? "volume" : metric === "winRate" ? "winRate" : "pnl";
  accounts.sort((a, b) => b[sortKey] - a[sortKey]);

  return accounts.slice(0, limit).map((row, index) => ({
    rank: index + 1,
    ...row.account,
    pnl: row.pnl,
    volume: row.volume,
  }));
}

export function getTopAccounts({ limit = 8, metric = "pnl", period = "ALL" } = {}) {
  return getLeaderboard({ metric, period, limit });
}

export function getTrendingAccounts({ limit = 5 } = {}) {
  return getLeaderboard({ metric: "volume", period: "WEEK", limit });
}

export function getRecentAccounts({ limit = 5 } = {}) {
  return getLeaderboard({ metric: "pnl", period: "MONTH", limit });
}

export function getDashboardStats() {
  const accounts = allAccounts();
  const aggregateVolume = accounts.reduce((sum, a) => sum + a.volume, 0);
  const openPositions = accounts.reduce((sum, a) => sum + a.openPositions, 0);
  const profitable = accounts.filter((a) => a.pnl >= 0).length;

  return {
    trackedAccounts: accounts.length,
    aggregateVolume,
    activeAccounts: accounts.filter((a) => a.openPositions > 0).length,
    openPositions,
    marketsObserved: Object.values(CATEGORY_MARKETS).reduce((a, b) => a + b, 0),
    profitableAccounts: profitable,
    losingAccounts: accounts.length - profitable,
  };
}

export function getActivityTrend({ days = 30, points = 24 } = {}) {
  const accounts = allAccounts();
  const bucketMs = (days * DAY) / points;
  const now = Date.now();
  const buckets = Array.from({ length: points }, (_, i) => ({
    date: new Date(now - (points - 1 - i) * bucketMs).toISOString(),
    value: 0,
  }));

  for (const account of accounts) {
    const rand = mulberry32(hashString(account.address + "trend"));
    const share = account.volume * 0.55;
    let remaining = share;
    for (let i = 0; i < points; i++) {
      const weight = i === points - 1 ? remaining : remaining * (0.05 + rand() * 0.16);
      remaining -= weight;
      buckets[i].value += round2(weight);
    }
  }

  return buckets.map((b) => ({ ...b, value: round2(b.value) }));
}

export function getPerformanceDistribution() {
  const accounts = allAccounts();
  const buckets = [
    { label: "20-40%", min: 0.2, max: 0.4, count: 0 },
    { label: "40-50%", min: 0.4, max: 0.5, count: 0 },
    { label: "50-60%", min: 0.5, max: 0.6, count: 0 },
    { label: "60-70%", min: 0.6, max: 0.7, count: 0 },
    { label: "70%+", min: 0.7, max: 1.01, count: 0 },
  ];
  for (const account of accounts) {
    const bucket = buckets.find((b) => account.winRate >= b.min && account.winRate < b.max);
    if (bucket) bucket.count += 1;
  }
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return buckets.map((b) => ({ ...b, share: b.count / max }));
}

export function getCategoryBreakdown() {
  const entries = Object.entries(CATEGORY_MARKETS).map(([category, count]) => ({ category, count }));
  const max = Math.max(...entries.map((e) => e.count));
  return entries.map((e) => ({ ...e, share: e.count / max }));
}

export function getRecentActivityFeed({ limit = 8 } = {}) {
  const accounts = allAccounts();
  const feed = [];
  for (const account of accounts) {
    const rand = mulberry32(hashString(account.address + "feed"));
    const count = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      const market = MARKET_TITLES[Math.floor(rand() * MARKET_TITLES.length)];
      const side = rand() > 0.5 ? "BUY" : "SELL";
      const price = round2(0.1 + rand() * 0.8);
      const size = Math.round(100 + rand() * 4000);
      feed.push({
        id: `feed-${account.address}-${i}`,
        account,
        type: side === "BUY" ? "Bought" : "Sold",
        market: market.title,
        category: market.category,
        side: i % 2 === 0 ? "YES" : "NO",
        amount: round2(price * size),
        price,
        timestamp: Date.now() - Math.floor(rand() * 4 * 24 * 60 * 60 * 1000),
      });
    }
  }
  feed.sort((a, b) => b.timestamp - a.timestamp);
  return feed.slice(0, limit);
}

export function compareAccounts(a, b) {
  const accountA = typeof a === "string" ? getAccount(a) : getAccountByAddress(a?.address);
  const accountB = typeof b === "string" ? getAccount(b) : getAccountByAddress(b?.address);
  if (!accountA || !accountB) return null;

  const build = (account) => ({
    account,
    metrics: {
      pnl: account.pnl,
      volume: account.volume,
      winRate: account.winRate,
      markets: account.markets,
      portfolioValue: account.portfolioValue,
      activityCount: account.activityCount,
      openPositions: account.openPositions,
    },
    performance: getAccountPerformanceSeries(account, "ALL"),
  });

  return { a: build(accountA), b: build(accountB) };
}

export function getAccountPerformanceSeries(account, range = "ALL") {
  const rand = mulberry32(hashString(account.address + "perf"));
  const days = range === "1D" ? 1 : range === "1W" ? 7 : range === "1M" ? 30 : range === "3M" ? 90 : 180;
  const points = range === "1D" ? 12 : range === "1W" ? 14 : 24;
  const now = Date.now();
  const stepMs = (days * DAY) / points;

  let value = 0;
  const total = account.volume;
  const remaining = () => total - value;
  const out = [];
  for (let i = 0; i < points; i++) {
    const share = i === points - 1 ? remaining() : remaining() * (0.02 + rand() * 0.1);
    value += share;
    out.push({ date: new Date(now - (points - 1 - i) * stepMs).toISOString(), value: round2(value) });
  }
  return out;
}

export function getEcosystemResources() {
  return ECOSYSTEM_RESOURCES;
}