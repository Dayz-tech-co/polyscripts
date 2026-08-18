// Central source of demo data for the PolyScripts public profile.
// Everything here is realistic mock data for demonstration purposes only.
// Components should consume this data through src/services/profileService.js
// rather than importing it directly, so a future real API can drop in cleanly.

const WALLET_ADDRESS = "0x3048d65321be3497164cdfc2996f94f98a2e7537";
const NOW = new Date("2026-08-18T16:00:00Z");

export const profile = {
  name: "PolyScripts",
  wallet: WALLET_ADDRESS,
  description: "Polymarket Bots, Strategies & Education",
  secondaryDescription:
    "Public prediction market analytics, strategies and automated trading research.",
  verified: true,
  joinedDate: "2024-02-11T00:00:00Z",
  explorerUrl: `https://polygonscan.com/address/${WALLET_ADDRESS}`,
};

export const stats = {
  portfolioValue: 84291.42,
  pnl: 18742.8,
  pnlPercent: 0.286,
  volume: 426800,
  marketsTraded: 147,
  winRate: 0.684,
  openPositionsCount: 11,
};

export const portfolioSummary = {
  availableBalance: 12840.12,
  openPositionValue: 71451.3,
  realizedPnl: 12420.5,
  unrealizedPnl: 6322.3,
  totalMarkets: 147,
  winRate: 0.684,
};

// ---------------------------------------------------------------------------
// Performance history
// ---------------------------------------------------------------------------

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

function generateSeries({ points, start, end, volatility, seed, days }) {
  const rand = mulberry32(seed);
  const raw = [0];
  for (let i = 1; i < points; i++) {
    raw.push(raw[i - 1] + (rand() - 0.5) * 2);
  }
  const last = raw[points - 1];
  const bridged = raw.map((v, i) => v - (last * i) / (points - 1));
  const maxAbs = Math.max(...bridged.map(Math.abs)) || 1;
  const valueRange = Math.abs(end - start) || end * 0.1;
  const noiseScale = valueRange * volatility;

  const msTotal = days * 24 * 60 * 60 * 1000;
  const series = bridged.map((v, i) => {
    const t = i / (points - 1);
    const linear = start + (end - start) * t;
    const noise = (v / maxAbs) * noiseScale * Math.sin(Math.PI * t + 0.15);
    const value = Math.max(linear + noise, end * 0.05);
    const date = new Date(NOW.getTime() - msTotal + msTotal * t);
    return { date: date.toISOString(), value: Math.round(value * 100) / 100 };
  });

  series[0].value = Math.round(start * 100) / 100;
  series[points - 1].value = Math.round(end * 100) / 100;
  return series;
}

const PORTFOLIO_VALUE = stats.portfolioValue;

export const performanceHistory = {
  "1D": generateSeries({
    points: 24,
    start: 83650.2,
    end: PORTFOLIO_VALUE,
    volatility: 0.012,
    seed: 11,
    days: 1,
  }),
  "1W": generateSeries({
    points: 42,
    start: 80120.65,
    end: PORTFOLIO_VALUE,
    volatility: 0.02,
    seed: 22,
    days: 7,
  }),
  "1M": generateSeries({
    points: 30,
    start: 65548.62,
    end: PORTFOLIO_VALUE,
    volatility: 0.035,
    seed: 33,
    days: 30,
  }),
  "3M": generateSeries({
    points: 60,
    start: 51980.1,
    end: PORTFOLIO_VALUE,
    volatility: 0.05,
    seed: 44,
    days: 90,
  }),
  ALL: generateSeries({
    points: 96,
    start: 24500.0,
    end: PORTFOLIO_VALUE,
    volatility: 0.07,
    seed: 55,
    days: 240,
  }),
};

// ---------------------------------------------------------------------------
// Markets / positions / activity
// ---------------------------------------------------------------------------

const MARKETS = [
  { title: "Will Bitcoin be above $100K by December?", category: "Crypto", tag: "BTC" },
  { title: "US Presidential Approval above 50% this month?", category: "Politics", tag: "POL" },
  { title: "Will the Fed cut rates at the next meeting?", category: "Economy", tag: "FED" },
  { title: "Ethereum above $5,000 before year end?", category: "Crypto", tag: "ETH" },
  { title: "Will the Lakers make the playoffs this season?", category: "Sports", tag: "NBA" },
  { title: "Will inflation stay below 3% this quarter?", category: "Economy", tag: "CPI" },
  { title: "Will a Category 5 hurricane make US landfall this season?", category: "Weather", tag: "WX" },
  { title: "Will Tesla stock close above $300 this month?", category: "Business", tag: "TSLA" },
  { title: "Will Congress pass the infrastructure bill by year end?", category: "Politics", tag: "GOV" },
  { title: "Will Solana flip Ethereum in market cap this year?", category: "Crypto", tag: "SOL" },
  { title: "Will unemployment stay below 4% this quarter?", category: "Economy", tag: "JOB" },
  { title: "Will SpaceX complete 10 launches this quarter?", category: "Tech", tag: "SPX" },
  { title: "Will the next iPhone launch in September?", category: "Tech", tag: "AAPL" },
  { title: "Will Argentina win the next Copa America?", category: "Sports", tag: "CA" },
  { title: "Will gold close above $2,700 this month?", category: "Business", tag: "XAU" },
  { title: "Will Manchester City win the Premier League?", category: "Sports", tag: "EPL" },
  { title: "Will OpenAI announce a new model this quarter?", category: "Tech", tag: "AI" },
  { title: "Will oil prices stay below $80 a barrel?", category: "Business", tag: "OIL" },
];

function round2(n) {
  return Math.round(n * 100) / 100;
}

function buildOpenPosition(id, marketIndex, side, averagePrice, currentPrice, shares, closeDate) {
  const market = MARKETS[marketIndex];
  const invested = round2(shares * averagePrice);
  const currentValue = round2(shares * currentPrice);
  const pnl = round2(currentValue - invested);
  const pnlPercent = invested !== 0 ? pnl / invested : 0;
  return {
    id,
    market: market.title,
    category: market.category,
    tag: market.tag,
    side,
    averagePrice,
    currentPrice,
    shares,
    invested,
    currentValue,
    pnl,
    pnlPercent,
    status: "open",
    closeDate,
  };
}

export const openPositions = [
  buildOpenPosition("op-1", 0, "YES", 0.54, 0.71, 9200, "2026-12-31T00:00:00Z"),
  buildOpenPosition("op-2", 1, "NO", 0.38, 0.29, 12500, "2026-08-31T00:00:00Z"),
  buildOpenPosition("op-3", 2, "YES", 0.61, 0.66, 7800, "2026-09-17T00:00:00Z"),
  buildOpenPosition("op-4", 3, "YES", 0.44, 0.52, 6100, "2026-12-31T00:00:00Z"),
  buildOpenPosition("op-5", 5, "NO", 0.33, 0.24, 15400, "2026-10-01T00:00:00Z"),
  buildOpenPosition("op-6", 9, "YES", 0.19, 0.27, 22000, "2026-12-31T00:00:00Z"),
  buildOpenPosition("op-7", 11, "YES", 0.72, 0.68, 4300, "2026-09-30T00:00:00Z"),
  buildOpenPosition("op-8", 14, "NO", 0.47, 0.41, 8900, "2026-08-29T00:00:00Z"),
  buildOpenPosition("op-9", 16, "YES", 0.28, 0.35, 11200, "2026-09-30T00:00:00Z"),
  buildOpenPosition("op-10", 7, "YES", 0.58, 0.63, 5200, "2026-08-30T00:00:00Z"),
  buildOpenPosition("op-11", 12, "NO", 0.51, 0.46, 6700, "2026-09-15T00:00:00Z"),
];

function buildResolvedPosition(id, marketIndex, side, averagePrice, shares, outcome, resolvedDate) {
  const market = MARKETS[marketIndex];
  const invested = round2(shares * averagePrice);
  const returned = outcome === "won" ? round2(shares * 1) : 0;
  const pnl = round2(returned - invested);
  const pnlPercent = invested !== 0 ? pnl / invested : 0;
  return {
    id,
    market: market.title,
    category: market.category,
    tag: market.tag,
    side,
    averagePrice,
    currentPrice: outcome === "won" ? 1 : 0,
    shares,
    invested,
    currentValue: returned,
    returned,
    pnl,
    pnlPercent,
    status: "resolved",
    outcome,
    closeDate: resolvedDate,
  };
}

export const resolvedPositions = [
  buildResolvedPosition("rp-1", 4, "NO", 0.62, 5400, "won", "2026-07-14T00:00:00Z"),
  buildResolvedPosition("rp-2", 6, "YES", 0.31, 8200, "lost", "2026-07-02T00:00:00Z"),
  buildResolvedPosition("rp-3", 8, "YES", 0.47, 6600, "won", "2026-06-21T00:00:00Z"),
  buildResolvedPosition("rp-4", 10, "NO", 0.55, 4100, "won", "2026-06-05T00:00:00Z"),
  buildResolvedPosition("rp-5", 13, "YES", 0.24, 9800, "lost", "2026-05-19T00:00:00Z"),
  buildResolvedPosition("rp-6", 15, "YES", 0.66, 3300, "won", "2026-05-02T00:00:00Z"),
  buildResolvedPosition("rp-7", 17, "NO", 0.4, 7100, "won", "2026-04-11T00:00:00Z"),
];

function hoursAgo(h) {
  return new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString();
}

export const recentActivity = [
  { id: "a-1", type: "Bought", market: MARKETS[0].title, tag: MARKETS[0].tag, side: "YES", amount: 1240, price: 0.62, shares: 2000, timestamp: hoursAgo(2) },
  { id: "a-2", type: "Sold", market: MARKETS[3].title, tag: MARKETS[3].tag, side: "YES", amount: 860, price: 0.52, shares: 1654, timestamp: hoursAgo(5) },
  { id: "a-3", type: "Bought", market: MARKETS[9].title, tag: MARKETS[9].tag, side: "YES", amount: 2100, price: 0.19, shares: 11052, timestamp: hoursAgo(9) },
  { id: "a-4", type: "Redeemed", market: MARKETS[4].title, tag: MARKETS[4].tag, side: "NO", amount: 3348, price: 1, shares: 5400, timestamp: hoursAgo(14) },
  { id: "a-5", type: "Bought", market: MARKETS[11].title, tag: MARKETS[11].tag, side: "YES", amount: 990, price: 0.72, shares: 1375, timestamp: hoursAgo(20) },
  { id: "a-6", type: "Sold", market: MARKETS[5].title, tag: MARKETS[5].tag, side: "NO", amount: 1520, price: 0.24, shares: 6333, timestamp: hoursAgo(27) },
  { id: "a-7", type: "Bought", market: MARKETS[16].title, tag: MARKETS[16].tag, side: "YES", amount: 640, price: 0.28, shares: 2285, timestamp: hoursAgo(33) },
  { id: "a-8", type: "Redeemed", market: MARKETS[6].title, tag: MARKETS[6].tag, side: "YES", amount: 0, price: 0, shares: 8200, timestamp: hoursAgo(40) },
  { id: "a-9", type: "Bought", market: MARKETS[14].title, tag: MARKETS[14].tag, side: "NO", amount: 1780, price: 0.47, shares: 3787, timestamp: hoursAgo(48) },
  { id: "a-10", type: "Sold", market: MARKETS[1].title, tag: MARKETS[1].tag, side: "NO", amount: 2205, price: 0.29, shares: 7603, timestamp: hoursAgo(55) },
  { id: "a-11", type: "Bought", market: MARKETS[2].title, tag: MARKETS[2].tag, side: "YES", amount: 3050, price: 0.61, shares: 5000, timestamp: hoursAgo(63) },
  { id: "a-12", type: "Redeemed", market: MARKETS[8].title, tag: MARKETS[8].tag, side: "YES", amount: 6600, price: 1, shares: 6600, timestamp: hoursAgo(72) },
  { id: "a-13", type: "Bought", market: MARKETS[7].title, tag: MARKETS[7].tag, side: "YES", amount: 1450, price: 0.58, shares: 2500, timestamp: hoursAgo(81) },
  { id: "a-14", type: "Sold", market: MARKETS[10].title, tag: MARKETS[10].tag, side: "NO", amount: 940, price: 0.55, shares: 1709, timestamp: hoursAgo(90) },
  { id: "a-15", type: "Bought", market: MARKETS[12].title, tag: MARKETS[12].tag, side: "NO", amount: 1120, price: 0.51, shares: 2196, timestamp: hoursAgo(101) },
  { id: "a-16", type: "Redeemed", market: MARKETS[13].title, tag: MARKETS[13].tag, side: "YES", amount: 0, price: 0, shares: 9800, timestamp: hoursAgo(115) },
  { id: "a-17", type: "Bought", market: MARKETS[15].title, tag: MARKETS[15].tag, side: "YES", amount: 2180, price: 0.66, shares: 3303, timestamp: hoursAgo(130) },
  { id: "a-18", type: "Sold", market: MARKETS[17].title, tag: MARKETS[17].tag, side: "NO", amount: 2840, price: 0.4, shares: 7100, timestamp: hoursAgo(148) },
];

export const allMarketsIndex = MARKETS;
