// Mock provider used when VITE_DATA_PROVIDER=mock (the default for this
// demo build). Implements the exact same function signatures as
// livePolymarketProvider so the rest of the app never knows which one is
// active. Unlike the previous version, every value is now derived from the
// single normalized demo dataset in src/providers/demoProvider.js, so the
// profile page, leaderboard, dashboard and comparison tool all report the
// same coherent numbers for the same account.

import * as demoProvider from "../../providers/demoProvider.js";

const DAY = 24 * 60 * 60 * 1000;

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

function toProfileShape(account) {
  return {
    proxyWallet: account.address,
    name: account.username,
    pseudonym: account.displayName,
    displayUsernamePublic: true,
    verifiedBadge: account.verified,
    profileImage: null,
    bio: account.bio,
    takerTierName: account.tierName,
    weightedVolume: account.volume,
    winRate: account.winRate,
    markets: account.markets,
    portfolioValue: account.portfolioValue,
    openPositions: account.openPositions,
    activityCount: account.activityCount,
    realizedPnl: account.realizedPnl,
    unrealizedPnl: account.unrealizedPnl,
  };
}

export async function searchProfiles(query, { limit = 8 } = {}) {
  return demoProvider.searchAccounts(query).slice(0, limit).map(toProfileShape);
}

export async function getPublicProfileByAddress(address) {
  const account = demoProvider.getAccountByAddress(address);
  return account ? toProfileShape(account) : null;
}

export async function getLeaderboard({ timePeriod = "DAY", orderBy = "PNL", limit = 25, user, userName } = {}) {
  const periodMap = { DAY: "DAY", WEEK: "WEEK", MONTH: "MONTH", ALL: "ALL" };
  const period = periodMap[timePeriod] || "DAY";
  const metric = orderBy === "VOL" ? "volume" : "pnl";
  const rows = demoProvider.getLeaderboard({ metric, period, limit: 25 });

  const toRow = (account) => {
    const row = rows.find((r) => r.address === account.address);
    return {
      rank: String(row ? row.rank : 1),
      proxyWallet: account.address,
      userName: account.username || null,
      vol: account.volume,
      pnl: account.pnl,
      winRate: account.winRate,
      markets: account.markets,
      profileImage: null,
      verifiedBadge: account.verified,
    };
  };

  if (user) {
    const account = demoProvider.getAccountByAddress(user);
    return account ? [toRow(account)] : [];
  }

  if (userName) {
    const account = demoProvider.getAccount(userName);
    return account ? [toRow(account)] : [];
  }

  return demoProvider.getLeaderboard({ metric, period, limit }).map((account) => ({
    rank: String(account.rank),
    proxyWallet: account.address,
    userName: account.username || null,
    vol: account.volume,
    pnl: account.pnl,
    winRate: account.winRate,
    markets: account.markets,
    profileImage: null,
    verifiedBadge: account.verified,
  }));
}

export async function getPositions(address) {
  const account = demoProvider.getAccountByAddress(address);
  if (!account) return [];
  const count = account.openPositions;
  const rand = mulberry32(hashString(address + "pos"));
  const weights = Array.from({ length: count }, () => 0.4 + rand() * 1.6);
  const wSum = weights.reduce((a, b) => a + b, 0);
  const pnlFactors = Array.from({ length: count }, () => 0.5 + rand() * 1.5);
  const pSum = pnlFactors.reduce((a, b) => a + b, 0);

  let valueAcc = 0;
  let pnlAcc = 0;
  const positions = [];

  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const currentValue = isLast ? round2(account.portfolioValue - valueAcc) : round2((account.portfolioValue * weights[i]) / wSum);
    const pnl = isLast ? round2(account.unrealizedPnl - pnlAcc) : round2((account.unrealizedPnl * pnlFactors[i]) / pSum);
    valueAcc += currentValue;
    pnlAcc += pnl;

    const market = demoMarket(i);
    const size = Math.round(200 + rand() * 4000);
    const invested = Math.max(1, round2(currentValue - pnl));
    const avgPrice = round2(Math.min(0.99, Math.max(0.01, invested / size)));
    const curPrice = round2(Math.min(0.99, Math.max(0.01, currentValue / size)));

    positions.push({
      conditionId: `demo-${address}-${i}`,
      asset: i % 2 === 0 ? "yes" : "no",
      title: market.title,
      category: market.category,
      slug: market.slug,
      icon: null,
      outcome: i % 2 === 0 ? "Yes" : "No",
      outcomeIndex: i % 2,
      avgPrice,
      curPrice,
      size,
      initialValue: invested,
      currentValue,
      cashPnl: pnl,
      percentPnl: invested > 0 ? (pnl / invested) * 100 : 0,
      endDate: new Date(Date.now() + (i + 1) * 12 * DAY).toISOString(),
      redeemable: false,
    });
  }

  return positions;
}

export async function getClosedPositions(address) {
  const account = demoProvider.getAccountByAddress(address);
  if (!account) return [];
  const count = account.resolvedPositions;
  const wins = Math.max(0, Math.min(count, Math.round(account.winRate * count)));
  const losses = count - wins;

  let winTotal;
  let lossTotal;
  if (account.realizedPnl >= 0) {
    lossTotal = losses > 0 ? round2(account.realizedPnl * 0.5) : 0;
    winTotal = round2(account.realizedPnl + lossTotal);
  } else {
    winTotal = wins > 0 ? round2(Math.abs(account.realizedPnl) * 0.6) : 0;
    lossTotal = round2(Math.abs(account.realizedPnl) + winTotal);
  }

  const rand = mulberry32(hashString(address + "closed"));
  const result = [];
  let winAcc = 0;
  let lossAcc = 0;
  let winIndex = 0;
  let lossIndex = 0;

  for (let i = 0; i < count; i++) {
    const isWin = i < wins;
    const isLastOfKind = isWin ? winIndex === wins - 1 : lossIndex === losses - 1;

    let pnl;
    if (isWin) {
      const amount = isLastOfKind ? round2(winTotal - winAcc) : round2(winTotal * (0.5 + rand() * 1.5));
      pnl = amount;
      winAcc += amount;
      winIndex += 1;
    } else {
      const magnitude = isLastOfKind ? round2(lossTotal - lossAcc) : round2(lossTotal * (0.5 + rand() * 1.5));
      pnl = -magnitude;
      lossAcc += magnitude;
      lossIndex += 1;
    }

    const market = demoMarket((i + 2) % 8);
    const totalBought = Math.round(200 + rand() * 4000);
    const invested = Math.max(1, round2(Math.abs(pnl) * 1.2 + 100));
    const avgPrice = round2(Math.min(0.99, Math.max(0.01, invested / totalBought)));

    result.push({
      conditionId: `demo-${address}-closed-${i}`,
      asset: isWin ? "yes" : "no",
      title: market.title,
      category: market.category,
      slug: market.slug,
      icon: null,
      outcome: isWin ? "Yes" : "No",
      outcomeIndex: isWin ? 0 : 1,
      avgPrice,
      totalBought,
      realizedPnl: pnl,
      timestamp: Math.floor(Date.now() / 1000) - (i + 1) * 5 * DAY / 1000,
    });
  }

  return result;
}

export async function getActivity(address) {
  const account = demoProvider.getAccountByAddress(address);
  if (!account) return [];
  const count = account.activityCount;
  const rand = mulberry32(hashString(address + "activity"));
  const weights = Array.from({ length: count }, () => 0.3 + rand() * 1.7);
  const wSum = weights.reduce((a, b) => a + b, 0);

  const spanMs = 14 * DAY;
  const now = Date.now();
  let acc = 0;

  return Array.from({ length: count }).map((_, i) => {
    const isLast = i === count - 1;
    const usdcSize = isLast ? round2(account.volume - acc) : round2((account.volume * weights[i]) / wSum);
    acc += usdcSize;

    const market = demoMarket(i % 8);
    const price = round2(0.1 + rand() * 0.8);
    const size = Math.max(1, Math.round(usdcSize / Math.max(0.01, price)));
    const side = rand() > 0.5 ? "BUY" : "SELL";

    return {
      proxyWallet: address,
      timestamp: Math.floor((now - (i * spanMs) / count) / 1000),
      conditionId: `demo-${address}-act-${i}`,
      type: "TRADE",
      side,
      title: market.title,
      category: market.category,
      slug: market.slug,
      icon: null,
      outcome: i % 2 === 0 ? "Yes" : "No",
      price,
      size,
      usdcSize,
      transactionHash: `0xdemo${i}${hashString(address)}`,
    };
  });
}

export async function getValue(address) {
  const account = demoProvider.getAccountByAddress(address);
  return account ? account.portfolioValue : null;
}

export async function getTraded(address) {
  const account = demoProvider.getAccountByAddress(address);
  return account ? account.markets : null;
}

// Each timeframe is its own independent series: a different time window,
// a different number of points and a different seeded trajectory, ending at
// a per-range share of the account's lifetime volume (or realized PnL for
// the performance metric). Ranges are never sliced from one shared array,
// so 1D/1W/1M/3M/ALL always differ.
const PERFORMANCE_RANGES = {
  "1D": { days: 1, points: 24, total: 0.35, inRange: [0.03, 0.08] },
  "1W": { days: 7, points: 14, total: 0.5, inRange: [0.12, 0.2] },
  "1M": { days: 30, points: 24, total: 0.7, inRange: [0.3, 0.45] },
  "3M": { days: 90, points: 26, total: 0.9, inRange: [0.6, 0.75] },
  ALL: { days: 180, points: 32, total: 1, inRange: [1, 1] },
};

export async function getPerformanceRange(address, { range = "ALL", metric = "performance" } = {}) {
  const account = demoProvider.getAccountByAddress(address);
  if (!account) return null;

  const cfg = PERFORMANCE_RANGES[range] || PERFORMANCE_RANGES.ALL;
  const rnd = mulberry32(hashString(address + "perf:" + range + ":" + metric));
  const lifetime = metric === "volume" ? account.volume : account.realizedPnl;

  // Fixed cumulative total per range keeps the headline monotonic
  // (1D < 1W < 1M < 3M < ALL); the amount realized within the window and
  // the trajectory are seeded independently per range so no two curves match.
  const total = round2(lifetime * cfg.total);
  const inRangeFactor = range === "ALL" ? 1 : cfg.inRange[0] + rnd() * (cfg.inRange[1] - cfg.inRange[0]);
  const inRange = round2(Math.abs(total) * inRangeFactor);
  const baseline = round2(total - inRange);

  const now = Date.now();
  const windowMs = cfg.days * DAY;
  const stepMs = windowMs / cfg.points;
  const startTime = now - windowMs;

  let acc = baseline;
  const points = [];
  for (let i = 0; i < cfg.points; i++) {
    const step = i === cfg.points - 1 ? inRange - (acc - baseline) : inRange * (0.02 + rnd() * 0.16);
    acc = round2(acc + step);
    points.push({ date: new Date(startTime + (i + 1) * stepMs).toISOString(), value: acc });
  }

  const startValue = points[0].value;
  const endValue = points[points.length - 1].value;
  const change = round2(endValue - startValue);
  const changePct = startValue !== 0 ? change / Math.abs(startValue) : null;
  return { points, total: endValue, change, changePct, startValue, endValue, metric };
}

const DEMO_MARKETS = [
  { title: "Will Bitcoin close above $100K this year?", slug: "btc-100k-eoy", category: "Crypto" },
  { title: "Fed cuts rates at the next meeting?", slug: "fed-rate-cut-next", category: "Economy" },
  { title: "Will the Lakers make the playoffs?", slug: "lakers-playoffs", category: "Sports" },
  { title: "Ethereum above $5,000 before year end?", slug: "eth-5k-eoy", category: "Crypto" },
  { title: "Will Congress pass the bill by year end?", slug: "congress-bill-eoy", category: "Politics" },
  { title: "AI chip supply keeps growing this quarter?", slug: "ai-chip-supply-q", category: "Tech" },
  { title: "Will it snow in NYC this weekend?", slug: "nyc-snow-weekend", category: "Weather" },
  { title: "Inflation cools below target by March?", slug: "inflation-below-target", category: "Economy" },
];

function demoMarket(index) {
  return DEMO_MARKETS[index % DEMO_MARKETS.length];
}