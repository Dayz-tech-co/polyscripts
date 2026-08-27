import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import RewardShareStudio from "../components/RewardShareStudio";
import RewardCardSkeleton from "../components/RewardCardSkeleton";
import { getRewardCard } from "../services/rewardsService";

const VALID_STREAMS = new Set(["total", "lp", "maker", "taker", "referral", "yield"]);

export default function RewardCardPage() {
  const { stream, identifier } = useParams();
  const metric = VALID_STREAMS.has(stream) ? stream : "total";
  const [state, setState] = useState({ status: "loading", account: null });

  useEffect(() => {
    document.title = "Reward Card | PolyScripts";
    const controller = new AbortController();
    setState({ status: "loading", account: null });
    getRewardCard(identifier, { signal: controller.signal })
      .then((account) => setState({ status: "ready", account }))
      .catch((error) => { if (error?.name !== "AbortError") setState({ status: "error", account: null }); });
    return () => controller.abort();
  }, [identifier]);

  return (
    <main id="main-content" className="container main-content reward-card-page">
      <Link to="/rewards" className="reward-card-back"><ArrowLeft size={14} /> Back to rewards</Link>
      {state.status === "loading" && <RewardCardSkeleton />}
      {state.status === "error" && <div className="reward-empty">This public reward card could not be loaded.</div>}
      {state.status === "ready" && state.account && <RewardShareStudio accounts={[state.account]} metric={metric} standalone />}
    </main>
  );
}
