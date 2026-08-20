// Polygon ERC-20 balanceOf via JSON-RPC eth_call (no web3 dependency).
// Sums pUSD + USDC.e + native USDC = cash available to trade (Betmoar-style).

import { POLYGON_RPC_URL, CASH_TOKENS, CASH_DECIMALS } from "./polymarketConfig";

const BALANCE_OF_SELECTOR = "0x70a08231"; // balanceOf(address)

function padAddress(address) {
  return address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

async function ethCall(to, data, { signal } = {}) {
  const res = await fetch(POLYGON_RPC_URL, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "RPC error");
  return json.result;
}

function decodeUint256(hex) {
  if (!hex || hex === "0x") return 0n;
  return BigInt(hex);
}

/**
 * @returns {Promise<number|null>} cash balance in USD units, or null on total failure
 */
export async function fetchCashBalance(wallet, { signal } = {}) {
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) return null;
  const data = `${BALANCE_OF_SELECTOR}${padAddress(wallet)}`;
  const scale = 10 ** CASH_DECIMALS;

  try {
    const results = await Promise.all(
      CASH_TOKENS.map(async (token) => {
        try {
          const raw = await ethCall(token.address, data, { signal });
          return Number(decodeUint256(raw)) / scale;
        } catch {
          return 0;
        }
      }),
    );
    const total = results.reduce((a, b) => a + b, 0);
    return Number.isFinite(total) ? Math.round(total * 100) / 100 : null;
  } catch {
    return null;
  }
}
