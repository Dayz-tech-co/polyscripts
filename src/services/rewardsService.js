import { getTopAccounts } from "./ecosystemService";
import { getAccountProfileOverview } from "./profileService";
import { fetchPusdSupply } from "./providers/cashBalance";
import { DATA_BASE } from "./providers/polymarketConfig";
import { normalizeActivity } from "../adapters/profileAdapter";
import { getMarketDetail } from "./marketService";

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

  // Dev has no serverless proxy. The full rewards list is ~30+ pages, so dev
  // reads the first page only and reports hasMore; production totals come
  // from the fully paginated api/rewards.js.
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

/** The rewards API only returns condition ids; attach each top market's title + slug. */
async function nameTopMarkets(markets = [], { signal } = {}) {
  return Promise.all(markets.map(async (market) => {
    try {
      const detail = await getMarketDetail(market.condition_id, { signal });
      return detail ? { ...market, question: market.question || detail.question, market_slug: detail.slug } : market;
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      return market;
    }
  }));
}

export async function getRewardsSnapshot({ signal } = {}) {
  const [rewards, pusdSupply] = await Promise.all([
    fetchActiveRewardMarkets({ signal }),
    fetchPusdSupply({ signal }),
  ]);
  const topMarkets = await nameTopMarkets(rewards.topMarkets, { signal });
  return {
    pusdSupply,
    ...rewards,
    topMarkets,
    updatedAt: Date.now(),
  };
}

const REWARD_EVENT_TYPES = "REWARD,MAKER_REBATE,TAKER_REBATE,REFERRAL_REWARD,YIELD";
const REWARD_PAGE = 500;
const MAX_REWARD_PAGES = 10;

/** Every reward-type activity event for a wallet, up to 5,000 payouts. */
async function fetchRewardEvents(address, { signal } = {}) {
  const out = [];
  for (let page = 0; page < MAX_REWARD_PAGES; page += 1) {
    const params = new URLSearchParams({
      user: address,
      type: REWARD_EVENT_TYPES,
      limit: String(REWARD_PAGE),
      offset: String(page * REWARD_PAGE),
      sortBy: "TIMESTAMP",
      sortDirection: "DESC",
    });
    const response = await fetch(`${DATA_BASE}/activity?${params}`, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Activity API ${response.status}`);
    const raw = await response.json();
    const rows = Array.isArray(raw) ? raw : [];
    out.push(...rows);
    if (rows.length < REWARD_PAGE) return { events: out, complete: true };
  }
  return { events: out, complete: false };
}

/** Loaded after the dashboard so reward history never blocks first paint. */
export async function getRewardAccounts({ limit = 4, signal } = {}) {
  const leaders = await getTopAccounts({ limit, metric: "volume", period: "ALL", signal }).catch(() => []);
  const cards = await Promise.all((leaders || []).map(async (account) => {
    try { return await getRewardCard(account.address, { signal }); } catch { return null; }
  }));
  return cards.filter(Boolean);
}

/** Fast card payload: identity overview + the wallet's complete reward events. */
export async function getRewardCard(identifier, { signal } = {}) {
  const overview = await getAccountProfileOverview(identifier, { signal });
  const { events, complete } = await fetchRewardEvents(overview.account.address, { signal });
  const stats = getAccountRewardStats({ ...overview, activity: events.map(normalizeActivity) });
  return { ...stats, complete };
}
