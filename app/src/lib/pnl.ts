import { MIST_PER_SUI } from "./config";
import { netDeployedMist, type PortfolioLedger } from "./portfolio-tracker";

export type PnlSnapshot = {
  totalSui: number;
  totalUsd: number | null;
  walletSui: number;
  vaultSui: number;
  walletUsd: number | null;
  vaultUsd: number | null;
  netDeployedSui: number;
  netDeployedUsd: number | null;
  yieldEarnedSui: number;
  yieldEarnedUsd: number | null;
  unrealizedPnlSui: number;
  unrealizedPnlUsd: number | null;
  pnlPercent: number | null;
  projectedDailyUsd: number | null;
  projectedMonthlyUsd: number | null;
  projectedYearlyUsd: number | null;
  vaultAllocationPct: number;
  hasYieldPosition: boolean;
  hasCostBasis: boolean;
};

function mistToSui(mist: bigint): number {
  return Number(mist) / Number(MIST_PER_SUI);
}

function usd(sui: number, priceUsd?: number): number | null {
  if (priceUsd == null || !Number.isFinite(priceUsd)) return null;
  return sui * priceUsd;
}

export function computePnl(input: {
  vaultSui: number;
  walletSui: number;
  priceUsd?: number;
  apyPercent?: number | null;
  ledger: PortfolioLedger;
}): PnlSnapshot {
  const { vaultSui, walletSui, priceUsd, apyPercent, ledger } = input;
  const totalSui = vaultSui + walletSui;
  const netDeployedSui = mistToSui(netDeployedMist(ledger));
  const hasYieldPosition = vaultSui > 0;
  const hasCostBasis = netDeployedSui > 0;

  const yieldEarnedSui =
    hasYieldPosition && hasCostBasis
      ? Math.max(0, vaultSui - netDeployedSui)
      : 0;

  const unrealizedPnlSui =
    hasCostBasis ? vaultSui - netDeployedSui : yieldEarnedSui;

  const pnlPercent =
    hasCostBasis && netDeployedSui > 0
      ? (unrealizedPnlSui / netDeployedSui) * 100
      : null;

  const vaultUsd = usd(vaultSui, priceUsd);
  const apy = apyPercent ?? 0;
  const projectedYearlyUsd =
    vaultUsd != null && apy > 0 ? (vaultUsd * apy) / 100 : null;

  return {
    totalSui,
    totalUsd: usd(totalSui, priceUsd),
    walletSui,
    vaultSui,
    walletUsd: usd(walletSui, priceUsd),
    vaultUsd,
    netDeployedSui,
    netDeployedUsd: usd(netDeployedSui, priceUsd),
    yieldEarnedSui,
    yieldEarnedUsd: usd(yieldEarnedSui, priceUsd),
    unrealizedPnlSui,
    unrealizedPnlUsd: usd(unrealizedPnlSui, priceUsd),
    pnlPercent,
    projectedDailyUsd:
      projectedYearlyUsd != null ? projectedYearlyUsd / 365 : null,
    projectedMonthlyUsd:
      projectedYearlyUsd != null ? projectedYearlyUsd / 12 : null,
    projectedYearlyUsd,
    vaultAllocationPct:
      totalSui > 0 ? (vaultSui / totalSui) * 100 : 0,
    hasYieldPosition,
    hasCostBasis,
  };
}

export function formatUsd(n: number | null, opts?: { signed?: boolean }): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = opts?.signed && n > 0 ? "+" : opts?.signed && n < 0 ? "" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(n / 1_000).toFixed(2)}K`;
  return `${sign}$${n.toFixed(2)}`;
}

export function formatSuiShort(n: number): string {
  if (n === 0) return "0";
  if (Math.abs(n) < 0.0001) return n.toExponential(2);
  return n.toFixed(4).replace(/\.?0+$/, (m) => (m === "." ? "" : m));
}

export function formatPct(n: number | null, signed = false): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
