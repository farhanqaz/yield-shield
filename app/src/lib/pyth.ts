/** Pyth Hermes — SUI/USD (same feed id across networks). */
export const PYTH_SUI_USD_FEED_ID =
  process.env.NEXT_PUBLIC_PYTH_SUI_FEED_ID ??
  "0xef0d8b6fda2ce01b21879bd86caea3e1dbd8ec4bfdaf0a2e3b1e3bbf1ebfc2c1";

type PythPriceFeed = {
  price: { price: string; expo: number; conf: string };
};

export async function fetchSuiUsdPrice(): Promise<{
  priceUsd: number;
  confidenceUsd: number;
}> {
  const id = PYTH_SUI_USD_FEED_ID.replace("0x", "");
  const url = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${id}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pyth Hermes error: ${res.status}`);

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
