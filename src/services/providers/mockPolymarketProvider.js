// Mock provider used only when VITE_DATA_PROVIDER=mock (local development
// without network access, demos, tests). Implements the exact same function
// signatures as livePolymarketProvider so the rest of the app never knows
// which one is active. Every value here is clearly synthetic and generated
// deterministically from the account identifier, never presented as if it
// came from a real user.

const DEMO_ROSTER = [
  { name: "swisstony", pseudonym: "Frail-Possible", address: "0x204f72f35326db932158cba6adff0b9a1da95e14", verified: false },
  { name: "ferrariChampions2026", pseudonym: "Bold-Circuit", address: "0xfe787d2da716d60e8acff57fb87eb13cd4d10319", verified: false },
  { name: "HomeRunHazard", pseudonym: "Quiet-Diamond", address: "0x5268527977f700f9bf9b6d5cd843859e4e70135d", verified: true },
  { name: "swisstony8", pseudonym: "Jaded-Feed", address: "0x19a644960679f35b7adbbc5dc56a2000b1cf5a80", verified: false },
  { name: null, pseudonym: "Silent-Ledger", address: "0x3048d65321be3497164cdfc2996f94f98a2e7537", verified: false },
  { name: "RWCS", pseudonym: "Steady-Signal", address: "0x4ab9b54427ec4b7f3646b1a0ef1bed73bc708ebe", verified: true },
];

const MARKET_TITLES = [
  { title: "Will Bitcoin close above $100K this year?", slug: "btc-100k-eoy" },
  { title: "Fed cuts rates at the next meeting?", slug: "fed-rate-cut-next" },
  { title: "Will the Lakers make the playoffs?", slug: "lakers-playoffs" },
  { title: "Ethereum above $5,000 before year end?", slug: "eth-5k-eoy" },
  { title: "Will Congress pass the bill by year end?", slug: "congress-bill-eoy" },
];

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

function seedFrom(value) {
  let hash = 0;
  const str = String(value || "seed");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function findByAddress(address) {
  return DEMO_ROSTER.find((a) => a.address.toLowerCase() === String(address).toLowerCase());
}

function findByName(query) {
  const q = query.toLowerCase();
  return DEMO_ROSTER.filter((a) => a.name && a.name.toLowerCase().includes(q));
}

export async function searchProfiles(query) {
  const matches = findByName(query);
  return matches.map((m) => ({
    name: m.name,
    pseudonym: m.pseudonym,
    displayUsernamePublic: true,
    proxyWallet: m.address,
    verifiedBadge: m.verified,
    profileImage: null,
  }));
}

export async function getPublicProfileByAddress(address) {
  const entry = findByAddress(address);
  if (!entry) return null;
  return {
    proxyWallet: entry.address,
    name: entry.name,
    pseudonym: entry.pseudonym,
    displayUsernamePublic: true,
    verifiedBadge: entry.verified,
    profileImage: null,
    bio: "Mock data - VITE_DATA_PROVIDER=mock",
    weightedVolume: seedFrom(entry.address) % 500000,
    takerTierName: null,
  };
}

export async function getLeaderboard({ limit = 25 } = {}) {
  return DEMO_ROSTER.slice(0, limit).map((entry, i) => ({
    rank: String(i + 1),
    proxyWallet: entry.address,
    userName: entry.name || `${entry.address}-0`,
    vol: seedFrom(entry.address + "vol") % 1_000_000,
    pnl: (seedFrom(entry.address + "pnl") % 200000) - 50000,
    profileImage: "",
    verifiedBadge: entry.verified,
  }));
}

export async function getPositions(address) {
  const rand = mulberry32(seedFrom(address + "pos"));
  const count = 3 + Math.floor(rand() * 4);
  return Array.from({ length: count }).map((_, i) => {
    const market = MARKET_TITLES[i % MARKET_TITLES.length];
    const avgPrice = round2(0.2 + rand() * 0.6);
    const curPrice = round2(Math.min(0.99, Math.max(0.01, avgPrice + (rand() - 0.5) * 0.3)));
    const size = Math.round(500 + rand() * 9000);
    const initialValue = round2(size * avgPrice);
    const currentValue = round2(size * curPrice);
    return {
      conditionId: `mock-${address}-${i}`,
      asset: i % 2 === 0 ? "yes" : "no",
      title: market.title,
      slug: market.slug,
      icon: null,
      outcome: i % 2 === 0 ? "Yes" : "No",
      outcomeIndex: i % 2,
      avgPrice,
      curPrice,
      size,
      initialValue,
      currentValue,
      cashPnl: round2(currentValue - initialValue),
      percentPnl: initialValue ? round2(((currentValue - initialValue) / initialValue) * 100) : 0,
      endDate: new Date(Date.now() + (i + 1) * 12 * 24 * 60 * 60 * 1000).toISOString(),
      redeemable: false,
    };
  });
}

export async function getClosedPositions(address) {
  const rand = mulberry32(seedFrom(address + "closed"));
  const count = 2 + Math.floor(rand() * 4);
  return Array.from({ length: count }).map((_, i) => {
    const market = MARKET_TITLES[(i + 2) % MARKET_TITLES.length];
    const avgPrice = round2(0.2 + rand() * 0.6);
    const totalBought = Math.round(500 + rand() * 6000);
    const won = rand() > 0.45;
    const realizedPnl = round2(won ? totalBought * (1 - avgPrice) * 0.6 : -totalBought * avgPrice * 0.5);
    return {
      conditionId: `mock-${address}-closed-${i}`,
      asset: won ? "yes" : "no",
      title: market.title,
      slug: market.slug,
      icon: null,
      outcome: won ? "Yes" : "No",
      outcomeIndex: won ? 0 : 1,
      avgPrice,
      totalBought,
      realizedPnl,
      timestamp: Math.floor(Date.now() / 1000) - (i + 1) * 5 * 24 * 60 * 60,
    };
  });
}

export async function getActivity(address) {
  const rand = mulberry32(seedFrom(address + "activity"));
  const count = 6 + Math.floor(rand() * 10);
  return Array.from({ length: count }).map((_, i) => {
    const market = MARKET_TITLES[i % MARKET_TITLES.length];
    const side = rand() > 0.5 ? "BUY" : "SELL";
    const price = round2(0.1 + rand() * 0.8);
    const size = Math.round(100 + rand() * 4000);
    return {
      proxyWallet: address,
      timestamp: Math.floor(Date.now() / 1000) - i * 6 * 60 * 60,
      conditionId: `mock-${address}-act-${i}`,
      type: "TRADE",
      side,
      title: market.title,
      slug: market.slug,
      icon: null,
      outcome: i % 2 === 0 ? "Yes" : "No",
      price,
      size,
      usdcSize: round2(price * size),
      transactionHash: `0xmock${i}${seedFrom(address)}`,
    };
  });
}

export async function getValue(address) {
  return seedFrom(address + "value") % 200000;
}

export async function getTraded(address) {
  return 4 + (seedFrom(address + "traded") % 40);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
