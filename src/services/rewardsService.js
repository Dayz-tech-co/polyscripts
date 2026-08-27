import { getTopAccounts } from "./ecosystemService";
import { getAccountProfile } from "./profileService";

const REWARD_TYPES = {
  REWARD: "lp",
  MAKER_REBATE: "maker",
  TAKER_REBATE: "taker",
  REFERRAL_REWARD: "referrals",
  YIELD: "yield",
};

function sum(values) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

export function getAccountRewardStats(bundle) {
  if (!bundle) return null;
  const rewardEvents = (bundle.activity || []).filter((item) => REWARD_TYPES[item.rawType]);
  const streams = { lp: 0, maker: 0, taker: 0, referrals: 0, yield: 0 };
  const days = new Map();

  rewardEvents.forEach((item) => {
    const amount = Number(item.amount);
    if (!Number.isFinite(amount)) return;
    streams[REWARD_TYPES[item.rawType]] += amount;
    const day = item.timestamp ? new Date(item.timestamp).toISOString().slice(0, 10) : "unknown";
    days.set(day, (days.get(day) || 0) + amount);
  });

  const total = sum(Object.values(streams));
  const daily = [...days.values()];
  return {
    account: bundle.account,
    rank: bundle.stats?.rank ?? null,
    streams,
    total,
    bestDay: daily.length ? Math.max(...daily) : null,
    averageDay: daily.length ? total / daily.length : null,
    eventCount: rewardEvents.length,
  };
}

export async function getRewardsSnapshot({ limit = 6, signal } = {}) {
  const leaders = (await getTopAccounts({ limit, metric: "volume", period: "ALL", signal })) || [];
  const bundles = await Promise.all(
    leaders.map(async (account) => {
      try {
        return await getAccountProfile(account.address, { signal });
      } catch {
        return null;
      }
    }),
  );
  const accounts = bundles.map(getAccountRewardStats).filter(Boolean);
  const streams = { lp: 0, maker: 0, taker: 0, referrals: 0, yield: 0 };
  accounts.forEach((item) => Object.keys(streams).forEach((key) => { streams[key] += item.streams[key]; }));
  return {
    accounts,
    streams,
    rewards: sum(Object.values(streams)),
    sampleSize: accounts.length,
  };
}
