import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, LoaderCircle, Repeat2, Sparkles, TrendingUp } from "lucide-react";
import PageHeader from "../components/PageHeader";
import RewardSparkline from "../components/RewardSparkline";
import RewardShareStudio from "../components/RewardShareStudio";
import { getRewardsSnapshot } from "../services/rewardsService";
import { formatCompactCurrency } from "../utils/formatters";

const STREAMS = [
  { key: "lp", label: "LP Rewards", color: "#f5b934" },
  { key: "maker", label: "Maker Rebates", color: "#20bde3" },
  { key: "taker", label: "Taker Rebates", color: "#ff8a3d" },
  { key: "referrals", label: "Referrals", color: "#316cf4" },
  { key: "yield", label: "Yield", color: "#ec4899" },
];

export default function RewardsPage() {
  const [state, setState] = useState({ status: "loading", data: null });
  useEffect(() => {
    document.title = "Rewards | PolyScripts";
    const controller = new AbortController();
    getRewardsSnapshot({ signal: controller.signal }).then((data) => setState({ status: "ready", data })).catch((error) => {
      if (error?.name !== "AbortError") setState({ status: "error", data: null });
    });
    return () => controller.abort();
  }, []);

  const charts = useMemo(() => Object.fromEntries(STREAMS.map(({ key }) => [key, state.data?.accounts?.map((account) => account.streams[key]) || []])), [state.data]);

  return (
    <main id="main-content" className="container main-content rewards-page">
      <PageHeader eyebrow="On-chain analytics" title="Rewards" description="Reward and rebate activity reported by public Polymarket account data." />
      <p className="reward-scope-note"><Sparkles size={14} /> Values cover the {state.data?.sampleSize ?? 0} highest-volume accounts successfully loaded, not the entire ecosystem.</p>
      {state.status === "loading" ? <div className="reward-loading"><LoaderCircle className="spin" /> Loading public reward activity…</div> : state.status === "error" ? <div className="reward-empty">Reward activity could not be loaded right now.</div> : <>
        <section className="reward-hero"><div><span className="reward-kicker">REWARDS · TRACKED SAMPLE</span><strong>{formatCompactCurrency(state.data.rewards)}</strong><p>Public LP, maker, taker, referral and yield events</p><div className="reward-periods"><span>ACCOUNTS <b>{state.data.sampleSize}</b></span><span>EVENTS <b>{state.data.accounts.reduce((n, item) => n + item.eventCount, 0)}</b></span></div></div><RewardSparkline values={state.data.accounts.map((account) => account.total)} color="#20bde3" /></section>
        <div className="reward-summary-grid">
          <article className="reward-metric"><div><span className="reward-dot green" />Reward distribution</div><strong>{formatCompactCurrency(state.data.rewards)}</strong><small>TRACKED SAMPLE</small><RewardSparkline values={state.data.accounts.map((account) => account.total)} /></article>
          <article className="reward-metric"><div><span className="reward-dot amber" />Trading fees</div><strong>N/A</strong><small>NOT EXPOSED BY PUBLIC API</small><CircleDollarSign /></article>
          <article className="reward-metric"><div><span className="reward-dot red" />Fees vs rewards</div><strong>N/A</strong><small>FEES UNAVAILABLE</small><Repeat2 /></article>
          <article className="reward-metric"><div><span className="reward-dot blue" />Perps</div><strong>N/A</strong><small>NOT EXPOSED BY PUBLIC API</small><TrendingUp /></article>
        </div>
        <section className="section"><div className="section-header"><h2 className="section-title">By reward stream</h2></div><div className="reward-stream-grid">{STREAMS.map(({ key, label, color }) => <article className="reward-stream" key={key}><div><span style={{ background: color }} />{label}</div><strong>{formatCompactCurrency(state.data.streams[key])}</strong><small>TRACKED SAMPLE</small><RewardSparkline values={charts[key]} color={color} /></article>)}</div></section>
        <RewardShareStudio accounts={state.data.accounts} />
      </>}
    </main>
  );
}
