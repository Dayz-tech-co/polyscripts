const CLOB_REWARDS_URL = "https://clob.polymarket.com/rewards/markets/current";
const PAGE_SIZE = 500;
const BATCH = 8;
const MAX_PAGES = 40;

// The CLOB cursor is the base64-encoded offset, so pages can be fetched in
// parallel batches instead of walking the cursor one request at a time.
function cursorFor(offset) {
  return Buffer.from(String(offset)).toString("base64");
}

async function fetchPage(offset) {
  const url = offset ? `${CLOB_REWARDS_URL}?next_cursor=${encodeURIComponent(cursorFor(offset))}` : CLOB_REWARDS_URL;
  const upstream = await fetch(url, { headers: { Accept: "application/json" } });
  if (!upstream.ok) throw new Error(`Rewards API ${upstream.status}`);
  const payload = await upstream.json();
  return Array.isArray(payload?.data) ? payload.data : [];
}

async function fetchAllMarkets() {
  const markets = [];
  for (let page = 0; page < MAX_PAGES; page += BATCH) {
    const batch = await Promise.all(
      Array.from({ length: BATCH }, (_, i) => fetchPage((page + i) * PAGE_SIZE).catch(() => null)),
    );
    for (const rows of batch) markets.push(...(rows || []));
    // A failed page means the totals are partial; a short page means we reached the end.
    if (batch.some((rows) => rows === null)) return { markets, complete: false };
    if (batch.some((rows) => rows.length < PAGE_SIZE)) return { markets, complete: true };
  }
  return { markets, complete: false };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { markets, complete } = await fetchAllMarkets();
    if (markets.length === 0) throw new Error("No rewards data");
    const total = (values) => values.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const summary = {
      activeMarkets: markets.length,
      configuredRewards: total(markets.flatMap((market) => (market.rewards_config || []).map((config) => config.total_rewards))),
      dailyRewards: total(markets.map((market) => market.total_daily_rate)),
      sponsoredDaily: total(markets.map((market) => market.sponsored_daily_rate)),
      nativeDaily: total(markets.map((market) => market.native_daily_rate)),
      topMarkets: [...markets].sort((a, b) => Number(b.total_daily_rate || 0) - Number(a.total_daily_rate || 0)).slice(0, 5),
      hasMore: !complete,
    };
    response.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    return response.status(200).json(summary);
  } catch {
    return response.status(502).json({ error: "Unable to load Polymarket rewards" });
  }
}
