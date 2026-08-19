# Data Integrity Report

Commit: `e2345ca` (pushed to `master`)
Date: 2026-08-19
Scope: Performance/Volume analytics, position/activity tables, profile stats
Method: live QA against Polymarket public APIs on profiles gmanas, kch123, swisstony; cross-checked every displayed number against raw API responses.

## Summary

Every number shown on the profile surfaces is derived from real Polymarket public data or is `N/A`. No invented, simulated, or averaged values are displayed. Where two public APIs measure the same concept differently (volume, PnL), the app prefers the authoritative source and labels the chart's scope explicitly.

## The 24 integrity items

### Chart metrics and derivation
1. **Performance = authoritative realized PnL.** The chart uses `GET /closed-positions` `realizedPnl`, applied at each position's resolution time. A cashflow approach from activity (`BUY −usdcSize / SELL +usdcSize / REDEEM +usdcSize`) was evaluated and rejected: it counts still-open buys as realized losses (kch123 showed −$415K vs the true −$65.9K), which is a false signal. The closed-positions source has no such bias.
2. **Volume = real traded notional.** `GET /activity` `TRADE` events only, `usdcSize` summed cumulatively. Monotonic up/flat by construction. Verified independently: kch123 raw activity sums to $6,188,968.59 and the chart shows exactly that; gmanas to $1,191,526.48 and the chart matches.
3. **Metrics are independent series.** Each range × metric combination builds its own dataset from its own feed (activity for volume, closed-positions for performance). Confirmed via direct provider calls: gmanas performance = $813,349.65, volume = $6,188,968.59 (equal values would indicate a cache/threading bug — it was a real bug, found and fixed, see #20).
4. **Every range fetches its own data.** Service cache key includes range and metric (`profile:${address}:perf:${range}:${metric}`, 60s TTL). Ranges are never derived from another range's dataset.
5. **Summary strip = same source as chart.** 1D/7D/30D/90D call the identical provider function with the same ranges/metric, so every number in the strip is consistent with the plotted curve. kch123 90D = −$57,596.25 matches the 3M window computation.
6. **Headline = range change (end − start), not a total.** For `ALL` this equals the cumulative curve value; for 1D/1W/1M/3M it is the delta within that window, so it never presents a truncated window's total as all-time.
7. **`changePct` is null when the baseline is zero** (`startValue !== 0` guard) — no division by zero, no invented percentage. The UI then shows "Realized PnL this period" instead of a fabricated number.
8. **Full-density series, no downsampling.** The chart plots every real event point in the window (≤50 closed positions, ≤2000 activity events) and never aggregates, so all genuine small movements, peaks, dips, jumps and short-term volatility are preserved. (The LTTB routine used earlier, and its bounds-overrun fix, are no longer on the chart path.)
9. **The chart never fabricates history beyond the API window.** Closed-positions returns at most 50 (it ignores larger `limit`, no pagination); the chart reflects exactly those 50. Activity paginates 500/page up to 2000 events; the chart reflects exactly the fetched window. No extrapolation.

### Honesty of displayed values
10. **Missing values show `N/A`, never 0 or `--`.** Formatters return `N/A` for null/undefined/NaN. kch123 unrealized PnL on resolved positions, and empty windows like gmanas 1D/7D/30D/90D, all render `N/A` — not $0.00.
11. **Empty windows are honest.** gmanas's 50 closed positions all resolved 2026-03-02 → 04-03 (verified from the API), outside every recent window, so all four strip cells are `N/A` and the chart says "No resolved positions in this period". This is correct data, not a bug.
12. **Zero-vs-unknown discipline.** `sumNotNull` counts only real values for averages; a genuine 0 count (e.g. 100 open positions whose current value the API reports as $0) is shown as $0.00 because the API returned exactly that.
13. **Win-rate from real closed positions.** gmanas 40/50 = 80.0%, kch123 35/15 = 70.0%, swisstony 28/22 = 56.0% — each matches `wins / closed` from the resolved-positions feed.
14. **Win/loss analytics are real distributions.** gmanas Avg Win +$23,738.32, Avg Loss −$13,618.32, Largest Win +$153,009.23, Largest Loss −$35,500.11 — all recomputed from the raw 50 realized PnL values.
15. **Chart headline === summary Realized PnL.** gmanas +$813,349.65 (chart and Portfolio Summary identical); kch123 −$65,880.06 identical; swisstony −$5,259.49 identical. No surface contradicts another.
16. **Volume precedence is correct.** Gamma's `weightedVolume` was 0 for gmanas and silently shadowed the leaderboard's real $537.38M. The leaderboard row now merges first and `deriveStats` prefers `rankEntry.volume`, fixing the display to $537.38M (was $0.00). Same for kch123 $298.64M and swisstony $1.82B.
17. **Leaderboard-first merge for PnL/rank too.** swisstony Total PnL +$23,600,489.67 and rank #1 come from the leaderboard; the gamma profile only fills fields the leaderboard lacks (bio, tier, avatar).
18. **Known, documented scope differences (not errors).** (a) Stat-card PnL/Volume are all-time leaderboard figures (kch123 +$11.39M / $298.64M); the chart's realized PnL ($65.9K) and volume ($1.19M) are the API-capped windows (50 positions / 2000 events). Both are labeled explicitly ("Cumulative … realized PnL / notional traded", "· All time"). (b) swisstony's four strip cells are identical because all 50 closed positions resolved today (ticks all "Aug 19") — verified against the API, not a computation error.

### Code/data quality
19. **No duplicate React keys.** Fixed the YES/NO same-`conditionId` collision (`${conditionId}-${asset}-open` / `-closed-${timestamp}`) and duplicate activity rows returned identically by the API (index-suffixed keys at the render site). swisstony's 150-row Positions tab and 500-row Activity tab render with zero console key errors.
20. **Volume-fallback masking bug fixed.** When the volume series failed, the card reused the previous (performance) dataset and labelled it "volume" — a false display. `lastData` is now retained only when it matches the current metric AND range.
21. **Market imagery is real.** Every position/activity row uses the market's real icon with a fallback; QA counted 6 real images / 0 fallbacks on the overview and no broken links.
22. **Dev-only integrity validation.** `validateProfileData` / `logDataIntegrity` run under `import.meta.env.DEV` on every profile load, checking header-PnL vs realized+unrealized tolerance, truncation-aware derivations, and contract consistency; findings are logged with level info vs error by severity.
23. **Mock/demo paths are opt-in only.** The live provider is the default; the mock provider mirrors the same metric semantics (seeded from real `account.volume` / `account.realizedPnl`) and is only active in offline/opt-in scenarios.
24. **Build, lint, live QA clean.** `npm run build` passes (347 kB JS), `npm run lint` reports only the pre-existing ToastContext fast-refresh warning, and live CDP QA across gmanas, kch123, swisstony, and the Compare page produced zero console errors after the fixes.

## Bugs found and fixed during this session
- LTTB average-bucket bounds overrun (crash on large series) → clamped `avgEnd`.
- Volume request silently returning the cached performance series (service threading verified, provider bug in series build isolated and fixed) → volume now $6.19M vs PnL $813K.
- Card displaying stale wrong-metric data on failure → metric+range-keyed `lastData`.
- Gamma `weightedVolume: 0` shadowing leaderboard volume → leaderboard-first merge + explicit precedence in `deriveStats`.
- Duplicate React keys from shared `conditionId` (YES/NO) and identical activity rows → unique ids + index suffix.