import { useEffect, useRef, useState, useCallback } from "react";
import { getAccountProfile } from "../services/profileService";
import { NotFoundError } from "../services/errors";

/**
 * Fetches the full profile bundle for one identifier (username or address).
 * Resets to a loading state the instant the identifier changes so a
 * previously viewed account never lingers on screen while the next one
 * loads, and exposes a retry for the error state.
 */
export function useProfile(identifier) {
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const abortRef = useRef(null);

  useEffect(() => {
    setStatus("loading");
    setData(null);
    abortRef.current?.abort();

    if (!identifier) {
      setStatus("not-found");
      return undefined;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    getAccountProfile(identifier, { signal: controller.signal })
      .then((bundle) => {
        setData(bundle);
        setStatus("success");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setStatus(err instanceof NotFoundError ? "not-found" : "error");
      });

    return () => controller.abort();
  }, [identifier, reloadToken]);

  const retry = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, data, retry };
}
