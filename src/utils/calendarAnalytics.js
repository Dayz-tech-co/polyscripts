/**
 * Utility to aggregate resolved positions and activity into daily and monthly performance metrics.
 * Uses strict UTC calendar grouping from the exact timestamped records and enforces
 * stable-identifier deduplication so no economic event can be double-counted.
 */

function round2(v) {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
}

function getStablePositionId(pos, index) {
  if (pos && pos.id) return String(pos.id);
  const condition = pos?.conditionId || pos?.asset || "closed";
  const dateStr = pos?.closeDate || pos?.timestamp || index;
  const pnlStr = pos?.pnl ?? 0;
  return `${condition}-${dateStr}-${pnlStr}`;
}

function getStableActivityId(act, index) {
  if (act && act.id) return String(act.id);
  const hash = act?.transactionHash || act?.conditionId || "act";
  const ts = act?.timestamp || index;
  const amt = act?.amount ?? 0;
  return `${hash}-${ts}-${amt}`;
}

export function buildDailyPerformance(resolvedPositions = [], activity = []) {
  const byDay = new Map();
  const byMonth = new Map();

  const rawResolvedCount = Array.isArray(resolvedPositions) ? resolvedPositions.length : 0;
  const seenResolvedIds = new Set();
  const deduplicatedResolved = [];

  for (let i = 0; i < rawResolvedCount; i++) {
    const pos = resolvedPositions[i];
    if (!pos) continue;
    const stableId = getStablePositionId(pos, i);
    if (seenResolvedIds.has(stableId)) continue;
    seenResolvedIds.add(stableId);
    deduplicatedResolved.push(pos);
  }

  // Aggregate deduplicated resolved positions by day and month
  for (const pos of deduplicatedResolved) {
    const ts = pos.closeDate ? new Date(pos.closeDate).getTime() : pos.timestamp ? pos.timestamp * 1000 : null;
    if (!ts || isNaN(ts)) continue;

    const dateObj = new Date(ts);
    const yyyy = dateObj.getUTCFullYear();
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getUTCDate()).padStart(2, "0");

    const dayKey = `${yyyy}-${mm}-${dd}`;
    const monthKey = `${yyyy}-${mm}`;

    const pnl = typeof pos.pnl === "number" && Number.isFinite(pos.pnl) ? pos.pnl : 0;
    const isWin = pnl >= 0;

    // Day level aggregation
    let dEntry = byDay.get(dayKey);
    if (!dEntry) {
      dEntry = { pnl: 0, wins: 0, losses: 0, winSum: 0, lossSum: 0, count: 0 };
      byDay.set(dayKey, dEntry);
    }
    dEntry.pnl = round2(dEntry.pnl + pnl);
    dEntry.count += 1;
    if (isWin) {
      dEntry.wins += 1;
      dEntry.winSum = round2(dEntry.winSum + pnl);
    } else {
      dEntry.losses += 1;
      dEntry.lossSum = round2(dEntry.lossSum + pnl);
    }

    // Month level aggregation
    let mEntry = byMonth.get(monthKey);
    if (!mEntry) {
      mEntry = { pnl: 0, wins: 0, losses: 0, winSum: 0, lossSum: 0, count: 0, volume: 0 };
      byMonth.set(monthKey, mEntry);
    }
    mEntry.pnl = round2(mEntry.pnl + pnl);
    mEntry.count += 1;
    if (isWin) {
      mEntry.wins += 1;
      mEntry.winSum = round2(mEntry.winSum + pnl);
    } else {
      mEntry.losses += 1;
      mEntry.lossSum = round2(mEntry.lossSum + pnl);
    }
  }

  // Deduplicate and aggregate trading volume by month from activity feed
  const rawActivityCount = Array.isArray(activity) ? activity.length : 0;
  const seenActivityIds = new Set();
  const deduplicatedActivity = [];

  for (let i = 0; i < rawActivityCount; i++) {
    const act = activity[i];
    if (!act) continue;
    const stableId = getStableActivityId(act, i);
    if (seenActivityIds.has(stableId)) continue;
    seenActivityIds.add(stableId);
    deduplicatedActivity.push(act);
  }

  for (const act of deduplicatedActivity) {
    if (!act.timestamp || act.rawType !== "TRADE") continue;
    const dateObj = new Date(act.timestamp);
    if (isNaN(dateObj.getTime())) continue;

    const yyyy = dateObj.getUTCFullYear();
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const monthKey = `${yyyy}-${mm}`;

    let mEntry = byMonth.get(monthKey);
    if (!mEntry) {
      mEntry = { pnl: 0, wins: 0, losses: 0, winSum: 0, lossSum: 0, count: 0, volume: 0 };
      byMonth.set(monthKey, mEntry);
    }
    mEntry.volume = round2(mEntry.volume + (act.amount ?? 0));
  }

  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) {
    const sampleDays = Array.from(byDay.keys()).slice(0, 3);
    for (const dKey of sampleDays) {
      const dData = byDay.get(dKey);
      console.debug(`[Calendar Analytics Verification]`, {
        date: dKey,
        sourceRecordCount: rawResolvedCount,
        deduplicatedRecordCount: deduplicatedResolved.length,
        dailyPnL: dData.pnl,
      });
    }
  }

  return { byDay, byMonth };
}
