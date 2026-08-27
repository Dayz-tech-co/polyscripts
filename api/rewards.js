const CLOB_REWARDS_URL = "https://clob.polymarket.com/rewards/markets/current";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const markets = [];
    let cursor = null;
    for (let page = 0; page < 10; page += 1) {
      const url = new URL(CLOB_REWARDS_URL);
      if (cursor) url.searchParams.set("next_cursor", cursor);
      const upstream = await fetch(url, { headers: { Accept: "application/json" } });
      if (!upstream.ok) throw new Error(`Rewards API ${upstream.status}`);
      const payload = await upstream.json();
      markets.push(...(Array.isArray(payload?.data) ? payload.data : []));
      cursor = payload?.next_cursor;
      if (!cursor || cursor === "LTE=") break;
    }
    response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return response.status(200).json({ data: markets, count: markets.length });
  } catch {
    return response.status(502).json({ error: "Unable to load Polymarket rewards" });
  }
}
