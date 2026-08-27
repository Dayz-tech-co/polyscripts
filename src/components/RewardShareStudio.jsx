import { useMemo, useState } from "react";
import { Check, RotateCcw, Share2 } from "lucide-react";
import Avatar from "./Avatar";
import LogoMark from "./Logo";
import { formatCurrency } from "../utils/formatters";
import { shortenAddress } from "../utils/address";
import { useToast } from "../context/toast";

const COLORS = ["#ff8a3d", "#ffffff", "#f5bd35", "#2fb57e", "#e5484d", "#20bde3", "#316cf4", "linear-gradient(135deg,#ff3366,#ffb800,#00d2ff)"];
const FONTS = ["Impact, sans-serif", "Arial Black, sans-serif", "Georgia, serif", "Trebuchet MS, sans-serif", "ui-monospace, monospace"];

function metricName(index) {
  return ["TOTAL REWARDS EARNED", "TOTAL MAKER REBATES EARNED", "TOTAL TAKER REBATES EARNED", "TOTAL REFERRALS EARNED"][index];
}

export default function RewardShareStudio({ accounts }) {
  const { showToast } = useToast();
  const [index, setIndex] = useState(0);
  const [font, setFont] = useState(0);
  const [size, setSize] = useState(72);
  const [opacity, setOpacity] = useState(100);
  const [color, setColor] = useState(COLORS[0]);
  const [shadow, setShadow] = useState("none");
  const [showStats, setShowStats] = useState(true);
  const [copied, setCopied] = useState(false);
  const item = accounts[index] || null;
  const values = useMemo(() => item ? [item.total, item.streams.maker, item.streams.taker, item.streams.referrals] : [], [item]);
  const value = values[index % 4] ?? 0;

  if (!item) return <div className="reward-empty">No reward-bearing accounts were available in this sample.</div>;

  const name = item.account.username || item.account.displayName || shortenAddress(item.account.address);
  const textShadow = shadow === "glow" ? `0 0 22px ${color}` : shadow === "drop" ? "0 8px 4px rgba(0,0,0,.8)" : shadow === "outline" ? "-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000" : "none";

  function reset() {
    setFont(0); setSize(72); setOpacity(100); setColor(COLORS[0]); setShadow("none"); setShowStats(true);
  }

  async function share() {
    const text = `${name} earned ${formatCurrency(value)} in Polymarket rewards — ${metricName(index % 4)}`;
    if (navigator.share) {
      try { await navigator.share({ title: "PolyScripts Rewards", text, url: window.location.href }); return; } catch { /* cancelled */ }
    }
    try { await navigator.clipboard.writeText(text); setCopied(true); showToast("Share text copied"); setTimeout(() => setCopied(false), 1600); } catch { showToast("Unable to copy share text"); }
  }

  return (
    <section className="reward-studio" aria-labelledby="reward-studio-title">
      <div className="section-header reward-studio-heading">
        <div><h2 className="section-title" id="reward-studio-title">Reward card studio</h2><p className="card-description">Customize and share verified account reward stats.</p></div>
        <button type="button" className="reward-share-action" onClick={share}>{copied ? <Check size={15} /> : <Share2 size={15} />}<span>{copied ? "Copied" : "Share card"}</span></button>
      </div>

      <div className="reward-carousel">
        <button type="button" className="reward-arrow" onClick={() => setIndex((index - 1 + accounts.length) % accounts.length)} aria-label="Previous card">‹</button>
        <article className="reward-share-card">
          <div className="reward-share-backdrop" />
          <div className="reward-share-top"><div className="reward-user"><Avatar account={item.account} size={48} /><div><strong>{name}</strong><span>{shortenAddress(item.account.address)}</span></div></div><span className="reward-brand"><LogoMark size={20} /><b>PolyScripts</b></span></div>
          <div className="reward-share-center"><strong style={{ fontFamily: FONTS[font], fontSize: `${size}px`, opacity: opacity / 100, color: color.startsWith("linear") ? "#ff8a3d" : color, textShadow }}>{formatCurrency(value, { decimals: 0 })}</strong><span>{metricName(index % 4)}</span></div>
          {showStats && <div className="reward-share-stats"><div><span>RANK</span><strong>{item.rank ? `#${item.rank}` : "N/A"}</strong></div><div><span>BEST DAY</span><strong>{formatCurrency(item.bestDay)}</strong></div><div><span>AVG / DAY</span><strong>{formatCurrency(item.averageDay)}</strong></div></div>}
        </article>
        <button type="button" className="reward-arrow" onClick={() => setIndex((index + 1) % accounts.length)} aria-label="Next card">›</button>
      </div>
      <div className="reward-dots" aria-label="Card selector">{accounts.map((account, i) => <button type="button" key={account.account.address} className={i === index ? "is-active" : ""} onClick={() => setIndex(i)} aria-label={`Show card ${i + 1}`} />)}</div>

      <div className="reward-controls">
        <div className="reward-control-row"><span>Font</span><div className="reward-fonts">{FONTS.map((family, i) => <button type="button" className={font === i ? "is-active" : ""} style={{ fontFamily: family }} onClick={() => setFont(i)} key={family}>Aa</button>)}</div><button type="button" className="reward-reset" onClick={reset}><RotateCcw size={14} /> Reset</button></div>
        <label className="reward-control-row"><span>Size</span><input type="range" min="42" max="96" value={size} onChange={(e) => setSize(Number(e.target.value))} /></label>
        <label className="reward-control-row"><span>Opacity</span><input type="range" min="30" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} /></label>
        <div className="reward-control-row"><span>Color</span><div className="reward-colors">{COLORS.map((entry) => <button type="button" key={entry} className={color === entry ? "is-active" : ""} style={{ background: entry }} onClick={() => setColor(entry)} />)}</div></div>
        <div className="reward-control-row"><span>Shadow</span><div className="reward-pills">{["glow", "drop", "outline", "none"].map((entry) => <button type="button" key={entry} className={shadow === entry ? "is-active" : ""} onClick={() => setShadow(entry)}>{entry}</button>)}</div></div>
        <div className="reward-control-row"><span>Stats</span><button type="button" className={`reward-toggle ${showStats ? "is-active" : ""}`} onClick={() => setShowStats(!showStats)}>{showStats ? "Shown" : "Hidden"}</button></div>
      </div>
    </section>
  );
}
