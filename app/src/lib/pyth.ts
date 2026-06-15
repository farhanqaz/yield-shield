import { CONFIG } from "./config";

/** Pyth Beta feed for Sui testnet (Hermes Beta). */
export const PYTH_SUI_USD_TESTNET_FEED_ID =
  "50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266";

/** Pyth stable feed for SUI/USD (Hermes main). */
export const PYTH_SUI_USD_MAINNET_FEED_ID =
  "23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744";

type PythPriceFeed = {
  price: { price: string; expo: number; conf: string };
};

function hermesBaseUrl(): string {
  return CONFIG.network === "mainnet"
    ? "https://hermes.pyth.network"
    : "https://hermes-beta.pyth.network";
}

export function getPythSuiFeedId(): string {
  const fromEnv = process.env.NEXT_PUBLIC_PYTH_SUI_FEED_ID?.replace(/^0x/, "");
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  return CONFIG.network === "mainnet"
    ? PYTH_SUI_USD_MAINNET_FEED_ID
    : PYTH_SUI_USD_TESTNET_FEED_ID;
}

export async function fetchSuiUsdPrice(): Promise<{
  priceUsd: number;
  confidenceUsd: number;
}> {
  const id = getPythSuiFeedId();
  const url = `${hermesBaseUrl()}/api/latest_price_feeds?ids[]=${id}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pyth Hermes error: ${res.status} ${body.slice(0, 120)}`);
  }

  const data = (await res.json()) as PythPriceFeed[];
  const feed = data[0];
  if (!feed?.price) throw new Error("No Pyth price feed returned");

  const scale = 10 ** Math.abs(feed.price.expo);
  const priceUsd = Number(feed.price.price) / scale;
  const confidenceUsd = Number(feed.price.conf) / scale;

  return { priceUsd, confidenceUsd };
}

/** Volatility proxy in bps from spot vs reference price (keeper/demo). */
export function volatilityBpsFromPrices(
  currentUsd: number,
  referenceUsd: number,
): number {
  if (referenceUsd <= 0) return 0;
  const delta = Math.abs(currentUsd - referenceUsd) / referenceUsd;
  return Math.min(10_000, Math.floor(delta * 10_000));
}
