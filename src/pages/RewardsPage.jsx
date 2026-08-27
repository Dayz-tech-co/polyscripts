import { useEffect, useState } from "react";
import { Activity, Coins, Droplets, Gift, LoaderCircle, RefreshCw } from "lucide-react";
import PageHeader from "../components/PageHeader";
import RewardShareStudio from "../components/RewardShareStudio";
import { getRewardsSnapshot } from "../services/rewardsService";
import { formatCompactCurrency, formatCurrency, formatNumber } from "../utils/formatters";

const METRICS = [
  { key: "dailyRewards", label: "Daily rewards", note: "Current emission rate", icon: Coins, tone: "orange", money: true },
  { key: "activeMarkets", label: "Reward markets", note: "Active configurations", icon: Activity, tone: "cyan" },
  { key: "configuredRewards", label: "Configured rewards", note: "Across active markets", icon: Gift, tone: "green", money: true },
  { key: "sponsoredDaily", label: "Sponsored / day", note: "Included in daily total", icon: Droplets, tone: "blue", money: true },
];

function compactId(value = "") {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-5)}` : value;
}

export default function RewardsPage() {
  const [state, setState] = useState({ status: "loading", data: null });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    document.title = "Rewards | PolyScripts";
    const controller = new AbortController();
    setState((current) => ({ status: "loading", data: current.data }));
    getRewardsSnapshot({ signal: controller.signal }).then((data) => setState({ status: "ready", data })).catch((error) => {
      if (error?.name !== "AbortError") setState({ status: "error", data: null });
    });
    return () => controller.abort();
  }, [reload]);

  const data = state.data;
  return (
    <main id="main-content" className="container main-content rewards-page">
      <PageHeader eyebrow="Live · on-chain" title="Rewards" description="Current Polymarket reward programs and public trader earnings.">
        <button type="button" className="btn btn-secondary rewards-refresh" onClick={() => setReload((value) => value + 1)} disabled={state.status === "loading"}><RefreshCw size={14} className={state.status === "loading" ? "spin" : ""} /> Refresh</button>
      </PageHeader>

      {state.status === "loading" && !data ? <div className="reward-loading"><LoaderCircle className="spin" /> Loading live Polymarket data…</div> : state.status === "error" ? <div className="reward-empty">Live rewards data could not be loaded. Try refreshing.</div> : data && <>
        <section className="rewards-overview" aria-label="Rewards overview">
          <div className="rewards-pusd"><div className="rewards-pusd-copy"><span>pUSD SUPPLY · POLYGON</span><strong>{formatCompactCurrency(data.pusdSupply)}</strong><p>Live ERC-20 total supply · backed by USDC</p></div><div className="rewards-live"><i />Live on-chain</div></div>
          <div className="rewards-metrics">{METRICS.map(({ key, label, note, icon: Icon, tone, money }) => <article className={`rewards-kpi is-${tone}`} key={key}><div className="rewards-kpi-icon"><Icon size={16} /></div><div><span>{label}</span><strong>{money ? formatCompactCurrency(data[key]) : formatNumber(data[key])}</strong><small>{note}</small></div></article>)}</div>
        </section>

        <section className="section rewards-markets" aria-labelledby="reward-markets-title">
          <div className="section-header"><div><h2 className="section-title" id="reward-markets-title">Top active reward markets</h2><p className="card-description">Ranked by current daily reward rate from the Polymarket CLOB.</p></div><div className="rewards-native"><span>Native / day</span><strong>{formatCompactCurrency(data.nativeDaily)}</strong></div></div>
          <div className="rewards-market-list">{data.topMarkets.map((market, index) => <article className="rewards-market-row" key={market.condition_id}><span className="rewards-market-rank">{index + 1}</span><div className="rewards-market-name"><strong>{market.question || market.market_slug || compactId(market.condition_id)}</strong><span>{compactId(market.condition_id)}</span></div><div><span>Daily</span><strong>{formatCurrency(market.total_daily_rate)}</strong></div><div><span>Min size</span><strong>{formatCurrency(market.rewards_min_size, { decimals: 0 })}</strong></div><div><span>Max spread</span><strong>{market.rewards_max_spread != null ? `${market.rewards_max_spread}¢` : "N/A"}</strong></div></article>)}</div>
        </section>

        <RewardShareStudio accounts={data.accounts} />
        <p className="rewards-source-note">Market metrics: Polymarket CLOB current rewards endpoint · pUSD: Polygon ERC-20 totalSupply · trader cards: public Data API activity.</p>
      </>}
    </main>
  );
}
