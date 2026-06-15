"use client";

import { computePnl, formatPct, formatSuiShort, formatUsd } from "@/lib/pnl";
import type { PortfolioLedger } from "@/lib/portfolio-tracker";
import { isNaviMode } from "@/lib/config";
import { PortfolioChart } from "@/components/charts/portfolio-chart";

type Props = {
  vaultSui: number;
  walletSui: number;
  priceUsd?: number;
  apyPercent?: number | null;
  shieldScore?: number;
  shieldStatus?: 0 | 1 | 2;
  ledger: PortfolioLedger | null;
  onSetBasis?: () => void;
};

const STATUS_LABEL = ["Safe", "Caution", "Paused"] as const;

function clampStatus(status: number): 0 | 1 | 2 {
  const n = Math.floor(Number(status));
  if (n <= 0) return 0;
  if (n >= 2) return 2;
  return n as 0 | 1 | 2;
}

function Metric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "up" | "down" | "neutral";
}) {
  const color =
    accent === "up"
      ? "text-emerald-400"
      : accent === "down"
        ? "text-red-400"
        : "text-[var(--text)]";

  return (
    <div className="rounded-lg border border-[var(--border)] bg-black/15 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${color}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

export function PortfolioPnl({
  vaultSui,
  walletSui,
  priceUsd,
  apyPercent,
  shieldScore,
  shieldStatus = 0,
  ledger,
  onSetBasis,
}: Props) {
  const safeStatus = clampStatus(shieldStatus);
  const pnl = computePnl({
    vaultSui,
    walletSui,
    priceUsd,
    apyPercent,
    ledger: ledger ?? {
      depositedMist: "0",
      withdrawnMist: "0",
      updatedAt: 0,
    },
  });

  const pnlAccent =
    pnl.unrealizedPnlUsd == null
      ? "neutral"
      : pnl.unrealizedPnlUsd >= 0
        ? "up"
        : "down";

  const yieldLabel = isNaviMode() ? "NAVI supply" : "Vault";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
            Total portfolio
          </p>
          <p className="font-mono text-2xl font-bold tabular-nums">
            {formatUsd(pnl.totalUsd) ?? "—"}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {formatSuiShort(pnl.totalSui)} SUI
            {priceUsd != null && ` · $${priceUsd.toFixed(4)}/SUI`}
          </p>
        </div>
        {pnl.hasYieldPosition && (
          <div className="text-right">
            <p className="text-[10px] text-[var(--muted)]">Unrealized PNL</p>
            <p
              className={`font-mono text-lg font-bold tabular-nums ${
                pnlAccent === "up"
                  ? "text-emerald-400"
                  : pnlAccent === "down"
                    ? "text-red-400"
                    : ""
              }`}
            >
              {formatUsd(pnl.unrealizedPnlUsd, { signed: true })}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {formatPct(pnl.pnlPercent, true)}
              {pnl.hasCostBasis ? "" : " · set basis on next Save"}
            </p>
          </div>
        )}
      </div>

      <PortfolioChart
        vaultSui={vaultSui}
        walletSui={walletSui}
        priceUsd={priceUsd}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric
          label={`In ${yieldLabel}`}
          value={`${formatSuiShort(pnl.vaultSui)} SUI`}
          sub={formatUsd(pnl.vaultUsd) ?? undefined}
        />
        <Metric
          label="Cost basis"
          value={`${formatSuiShort(pnl.netDeployedSui)} SUI`}
          sub={formatUsd(pnl.netDeployedUsd) ?? undefined}
        />
        <Metric
          label="Yield earned"
          value={`${formatSuiShort(pnl.yieldEarnedSui)} SUI`}
          sub={formatUsd(pnl.yieldEarnedUsd) ?? undefined}
          accent={pnl.yieldEarnedSui > 0 ? "up" : "neutral"}
        />
        <Metric
          label="Liquid wallet"
          value={`${formatSuiShort(pnl.walletSui)} SUI`}
          sub={formatUsd(pnl.walletUsd) ?? undefined}
        />
        <Metric
          label="Supply APY"
          value={
            apyPercent != null && Number.isFinite(apyPercent)
              ? `${apyPercent.toFixed(2)}%`
              : "—"
          }
          sub={isNaviMode() ? "NAVI mainnet" : "Mock vault"}
        />
        <Metric
          label="ShieldScore"
          value={shieldScore != null ? String(Math.round(shieldScore)) : "—"}
          sub={STATUS_LABEL[safeStatus]}
        />
      </div>

      {apyPercent != null && Number.isFinite(apyPercent) && pnl.vaultSui > 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">
            Projected yield (at current APY)
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-[var(--muted)]">Daily</p>
              <p className="font-mono font-semibold text-emerald-400">
                {formatUsd(pnl.projectedDailyUsd)}
              </p>
            </div>
            <div>
              <p className="text-[var(--muted)]">Monthly</p>
              <p className="font-mono font-semibold text-emerald-400">
                {formatUsd(pnl.projectedMonthlyUsd)}
              </p>
            </div>
            <div>
              <p className="text-[var(--muted)]">Yearly</p>
              <p className="font-mono font-semibold text-emerald-400">
                {formatUsd(pnl.projectedYearlyUsd)}
              </p>
            </div>
          </div>
        </div>
      )}

      {!pnl.hasCostBasis && pnl.hasYieldPosition && (
        <div className="space-y-2 text-center">
          <p className="text-[10px] text-[var(--muted)]">
            Cost basis tracks from Saves in this browser.
          </p>
          {onSetBasis && (
            <button
              type="button"
              onClick={onSetBasis}
              className="text-[11px] text-emerald-400 underline underline-offset-2"
            >
              Use current supply as cost basis
            </button>
          )}
        </div>
      )}
    </div>
  );
}
