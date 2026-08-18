// Provider selection. The rest of the app talks to services/polymarketService
// and services/profileService, which in turn call whichever provider is
// active here. The mock provider exists purely as an offline development
// fallback so every surface renders coherent demo data; production builds
// resolve accounts through the live public Polymarket endpoints. An explicit
// VITE_DATA_PROVIDER=mock|live always wins.
//
// Both providers implement the exact same function names, so nothing above
// this file needs to branch on which one is in use.

import * as livePolymarketProvider from "./livePolymarketProvider";
import * as mockPolymarketProvider from "./mockPolymarketProvider";

const explicit = import.meta.env.VITE_DATA_PROVIDER;
const mode = explicit === "live" || explicit === "mock" ? explicit : import.meta.env.DEV ? "mock" : "live";

export const provider = mode === "mock" ? mockPolymarketProvider : livePolymarketProvider;
