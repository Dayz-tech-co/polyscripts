import { useCallback, useEffect, useRef, useState } from "react";
import { searchAccounts } from "../services/polymarketService";
import { isValidAddress, looksLikeAddressInput } from "../utils/address";

const DEBOUNCE_MS = 320;
const MIN_USERNAME_CHARS = 2;

/**
 * Drives the account search dropdown: debounces username queries, resolves
 * complete addresses immediately, cancels stale requests, and exposes a
 * single { results, loading, error } surface for the UI to render.
 */
export function useAccountSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const requestIdRef = useRef(0);
  const abortRef = useRef(null);
  const timerRef = useRef(null);

  const trimmed = (query || "").trim();
  const incompleteAddress = looksLikeAddressInput(trimmed) && !isValidAddress(trimmed);
  const tooShort = !isValidAddress(trimmed) && !looksLikeAddressInput(trimmed) && trimmed.length < MIN_USERNAME_CHARS;

  const run = useCallback((q) => {
    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(false);

    searchAccounts(q, { signal: controller.signal })
      .then((accounts) => {
        if (requestIdRef.current !== requestId) return;
        setResults(accounts);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError" || requestIdRef.current !== requestId) return;
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (!trimmed || incompleteAddress || tooShort) {
      requestIdRef.current += 1;
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      setError(false);
      return undefined;
    }

    if (isValidAddress(trimmed)) {
      run(trimmed);
      return undefined;
    }

    timerRef.current = setTimeout(() => run(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [trimmed, incompleteAddress, tooShort, run]);

  const retry = useCallback(() => {
    if (trimmed) run(trimmed);
  }, [trimmed, run]);

  return { results, loading, error, incompleteAddress, retry };
}
