// Provider selection. The rest of the app talks to services/polymarketService
// and services/profileService, which in turn call whichever provider is
// active here - live public Polymarket data by default, or the mock
// provider when explicitly requested (offline dev, demos, tests).
//
// Both providers implement the exact same function names, so nothing above
// this file needs to branch on which one is in use.

import * as livePolymarketProvider from "./livePolymarketProvider";
import * as mockPolymarketProvider from "./mockPolymarketProvider";

const mode = import.meta.env.VITE_DATA_PROVIDER === "mock" ? "mock" : "live";

export const provider = mode === "mock" ? mockPolymarketProvider : livePolymarketProvider;
export const providerMode = mode;
