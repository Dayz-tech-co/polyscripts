// Polymarket public API base URLs (Betmoar-style). Override via Vite env.

export const GAMMA_BASE = import.meta.env.VITE_GAMMA_API_URL || "https://gamma-api.polymarket.com";
export const DATA_BASE = import.meta.env.VITE_DATA_API_URL || "https://data-api.polymarket.com";
export const USER_PNL_BASE = import.meta.env.VITE_USER_PNL_API_URL || "https://user-pnl-api.polymarket.com";
export const LB_BASE = import.meta.env.VITE_LB_API_URL || "https://lb-api.polymarket.com";
export const POLYGON_RPC_URL = import.meta.env.VITE_POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com";

/** ERC-20 contracts used for Polymarket cash (6 decimals). */
export const CASH_TOKENS = [
  { symbol: "pUSD", address: "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB" },
  { symbol: "USDC.e", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
  { symbol: "USDC", address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" },
];

export const CASH_DECIMALS = 6;
