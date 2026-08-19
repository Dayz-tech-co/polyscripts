// Fetches one performance timeframe on demand and replaces the dataset only
// when that range is ready for the currently requested identifier, range and
// metric. State is scoped by a request key so stale data from a previous
// range/metric/account is never exposed - the hook returns a loading state
// until the dataset matching the current request is ready.

import { useEffect, useState } from "react";
import { getPerformanceRange } from "../services/profileService";

export function usePerformanceRange(identifier, range, metric = "performance") {
  const requestedKey = `${identifier ?? ""}|${range}|${metric}`;
  const [state, setState] = useState({ status: "loading", data: null, key: requestedKey });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const key = requestedKey;

    setState({ status: "loading", data: null, key });

    if (!identifier) {
      return () => {
        cancelled = true;
      };
    }

    getPerformanceRange(identifier, { range, metric, signal: controller.signal })
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data, key });
      })
      .catch((err) => {
        if (err?.name === "AbortError" || cancelled) return;
        setState({ status: "error", data: null, key });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [identifier, range, metric, requestedKey]);

  // Only ever return data that belongs to the currently requested range,
  // metric and account. On the render right after a switch - before the
  // effect clears state - the stored key still reflects the previous request,
  // so a loading state is returned instead of the stale dataset.
  return state.key === requestedKey ? state : { status: "loading", data: null, key: requestedKey };
}