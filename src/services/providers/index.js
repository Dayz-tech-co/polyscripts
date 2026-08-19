// Provider selection. The rest of the app talks to services/polymarketService
// and services/profileService, which in turn call whichever provider is
// active here. Every build (dev and production) resolves through the live
// public Polymarket endpoints so no surface ever shows invented numbers.
//
// The mock provider exists purely as an explicit offline development
// fallback and is ONLY activated by setting VITE_DATA_PROVIDER=mock. It is
// never the default, so demo data can never leak into a submitted build.
//
// Both providers implement the exact same function names, so nothing above
// this file needs to branch on which one is in use.

import * as livePolymarketProvider from "./livePolymarketProvider";
import * as mockPolymarketProvider from "./mockPolymarketProvider";

const explicit = import.meta.env.VITE_DATA_PROVIDER;
const mode = explicit === "live" || explicit === "mock" ? explicit : "live";

export const provider = mode === "mock" ? mockPolymarketProvider : livePolymarketProvider;
