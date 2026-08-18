// Provider selection. The rest of the app talks to services/polymarketService
// and services/profileService, which in turn call whichever provider is
// active here. This demo build ships with the mock provider by default so
// every surface renders coherent offline data; switch to live public
// Polymarket data by setting VITE_DATA_PROVIDER=live.
//
// Both providers implement the exact same function names, so nothing above
// this file needs to branch on which one is in use.

import * as livePolymarketProvider from "./livePolymarketProvider";
import * as mockPolymarketProvider from "./mockPolymarketProvider";

const mode = import.meta.env.VITE_DATA_PROVIDER === "live" ? "live" : "mock";

export const provider = mode === "mock" ? mockPolymarketProvider : livePolymarketProvider;
export const providerMode = mode;
