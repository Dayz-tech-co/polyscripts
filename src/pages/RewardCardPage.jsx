import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import RewardShareStudio from "../components/RewardShareStudio";
import { useProfile } from "../hooks/useProfile";
import { getAccountRewardStats } from "../services/rewardsService";

const VALID_STREAMS = new Set(["total", "lp", "maker", "taker", "referral", "yield"]);

export default function RewardCardPage() {
  const { stream, identifier } = useParams();
  const { status, data, detailsStatus } = useProfile(identifier);
  const metric = VALID_STREAMS.has(stream) ? stream : "total";
  const rewardAccount = useMemo(() => getAccountRewardStats(data), [data]);

  useEffect(() => { document.title = "Reward Card | PolyScripts"; }, []);

  return (
    <main id="main-content" className="container main-content reward-card-page">
      <Link to="/rewards" className="reward-card-back"><ArrowLeft size={14} /> Back to rewards</Link>
      {(status === "loading" || detailsStatus === "loading") && <div className="reward-loading"><LoaderCircle className="spin" /> Loading public reward history…</div>}
      {status === "not-found" && <div className="reward-empty">This public account could not be found.</div>}
      {status === "error" && <div className="reward-empty">The reward card could not be loaded.</div>}
      {status === "success" && detailsStatus !== "loading" && rewardAccount && <RewardShareStudio accounts={[rewardAccount]} metric={metric} standalone />}
    </main>
  );
}
