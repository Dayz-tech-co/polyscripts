const CLOB_REWARDS_URL = "https://clob.polymarket.com/rewards/markets/current";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const upstream = await fetch(CLOB_REWARDS_URL, { headers: { Accept: "application/json" } });
    if (!upstream.ok) throw new Error(`Rewards API ${upstream.status}`);
    const payload = await upstream.json();
    const markets = Array.isArray(payload?.data) ? payload.data : [];
    const total = (values) => values.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const summary = {
      activeMarkets: markets.length,
      configuredRewards: total(markets.flatMap((market) => (market.rewards_config || []).map((config) => config.total_rewards))),
      dailyRewards: total(markets.map((market) => market.total_daily_rate)),
      sponsoredDaily: total(markets.map((market) => market.sponsored_daily_rate)),
      nativeDaily: total(markets.map((market) => market.native_daily_rate)),
      topMarkets: [...markets].sort((a, b) => Number(b.total_daily_rate || 0) - Number(a.total_daily_rate || 0)).slice(0, 5),
      hasMore: Boolean(payload?.next_cursor && payload.next_cursor !== "LTE="),
    };
    response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return response.status(200).json(summary);
  } catch {
    return response.status(502).json({ error: "Unable to load Polymarket rewards" });
  }
}
