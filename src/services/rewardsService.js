import { getTopAccounts } from "./ecosystemService";
import { getAccountProfile } from "./profileService";
import { fetchPusdSupply } from "./providers/cashBalance";

const CLOB_BASE = import.meta.env.VITE_CLOB_API_URL || "https://clob.polymarket.com";
const REWARD_TYPES = { REWARD: "lp", MAKER_REBATE: "maker", TAKER_REBATE: "taker", REFERRAL_REWARD: "referrals", YIELD: "yield" };

function sum(values) {
  return values.reduce((total, value) => total + (Number.isFinite(Number(value)) ? Number(value) : 0), 0);
}

async function fetchActiveRewardMarkets({ signal } = {}) {
  if (import.meta.env.PROD) {
    const response = await fetch("/api/rewards", { signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Rewards proxy ${response.status}`);
    const payload = await response.json();
    return payload;
  }

  const response = await fetch(`${CLOB_BASE}/rewards/markets/current`, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Rewards API ${response.status}`);
  const payload = await response.json();
  const markets = Array.isArray(payload?.data) ? payload.data : [];
  return {
    activeMarkets: markets.length,
    configuredRewards: sum(markets.flatMap((market) => (market.rewards_config || []).map((config) => config.total_rewards))),
    dailyRewards: sum(markets.map((market) => market.total_daily_rate)),
    sponsoredDaily: sum(markets.map((market) => market.sponsored_daily_rate)),
    nativeDaily: sum(markets.map((market) => market.native_daily_rate)),
    topMarkets: [...markets].sort((a, b) => Number(b.total_daily_rate || 0) - Number(a.total_daily_rate || 0)).slice(0, 5),
    hasMore: Boolean(payload?.next_cursor && payload.next_cursor !== "LTE="),
  };
}

export function getAccountRewardStats(bundle) {
  if (!bundle) return null;
  const events = (bundle.activity || []).filter((item) => REWARD_TYPES[item.rawType] && Number.isFinite(Number(item.amount)));
  const streams = { lp: 0, maker: 0, taker: 0, referrals: 0, yield: 0 };
  const days = new Map();
  events.forEach((item) => {
    const amount = Number(item.amount);
    streams[REWARD_TYPES[item.rawType]] += amount;
    const day = item.timestamp ? new Date(item.timestamp).toISOString().slice(0, 10) : "unknown";
    days.set(day, (days.get(day) || 0) + amount);
  });
  const total = sum(Object.values(streams));
  const daily = [...days.values()];
  return { account: bundle.account, rank: bundle.stats?.rank ?? null, streams, total, bestDay: daily.length ? Math.max(...daily) : null, averageDay: daily.length ? total / daily.length : null, eventCount: events.length };
}

export async function getRewardsSnapshot({ signal } = {}) {
  const [rewards, pusdSupply] = await Promise.all([
    fetchActiveRewardMarkets({ signal }),
    fetchPusdSupply({ signal }),
  ]);
  return {
    pusdSupply,
    ...rewards,
    updatedAt: Date.now(),
  };
}

/** Loaded after the dashboard so deep account history never blocks first paint. */
export async function getRewardAccounts({ limit = 4, signal } = {}) {
  const leaders = await getTopAccounts({ limit, metric: "volume", period: "ALL", signal }).catch(() => []);
  const bundles = await Promise.all((leaders || []).map(async (account) => {
    try { return await getAccountProfile(account.address, { signal }); } catch { return null; }
  }));
  return bundles.map(getAccountRewardStats).filter(Boolean);
}
