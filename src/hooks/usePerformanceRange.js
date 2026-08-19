// Fetches one performance timeframe on demand and replaces the dataset only
// when that range is ready. Clears any previous series the instant the
// identifier or range changes, so the chart never mixes accounts or ranges.

import { useEffect, useState } from "react";
import { getPerformanceRange } from "../services/profileService";

export function usePerformanceRange(identifier, range, metric = "performance") {
  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setState({ status: "loading", data: null });

    if (!identifier) {
      return () => {
        cancelled = true;
      };
    }

    getPerformanceRange(identifier, { range, metric, signal: controller.signal })
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err) => {
        if (err?.name === "AbortError" || cancelled) return;
        setState({ status: "error", data: null });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [identifier, range, metric]);

  return state;
}