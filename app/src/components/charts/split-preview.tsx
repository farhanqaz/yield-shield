"use client";

import { bpsToPercent } from "@/lib/split-preference";

type Props = {
  totalSui: number;
  vaultBps: number;
  priceUsd?: number;
};

function fmt(n: number): string {
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  return n.toFixed(4).replace(/\.?0+$/, (m) => (m === "." ? "" : m));
}

export function SplitPreview({ totalSui, vaultBps, priceUsd }: Props) {
  const vaultPct = bpsToPercent(vaultBps);
  const liquidPct = 100 - vaultPct;
  const vaultSui = totalSui > 0 ? (totalSui * vaultPct) / 100 : 0;
  const liquidSui = totalSui > 0 ? totalSui - vaultSui : 0;
  const hasAmount = totalSui > 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-black/20 p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
        Split preview
      </p>

      <div className="mt-3 flex h-8 overflow-hidden rounded-lg">
        <div
          className="flex items-center justify-center bg-[var(--safe)]/80 text-[10px] font-semibold text-emerald-950 transition-all duration-300"
          style={{ width: `${vaultPct}%`, minWidth: vaultPct > 0 ? "2rem" : 0 }}
        >
          {vaultPct >= 18 && `${vaultPct}%`}
        </div>
        <div
          className="flex items-center justify-center bg-[var(--accent)]/70 text-[10px] font-semibold text-sky-950 transition-all duration-300"
          style={{ width: `${liquidPct}%`, minWidth: liquidPct > 0 ? "2rem" : 0 }}
        >
          {liquidPct >= 18 && `${liquidPct}%`}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="flex items-center gap-1.5 text-[var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--safe)]" />
            Vault (saved)
          </p>
          <p className="mt-0.5 font-mono font-semibold tabular-nums">
            {hasAmount ? `${fmt(vaultSui)} SUI` : "—"}
          </p>
          {hasAmount && priceUsd && (
            <p className="text-[10px] text-[var(--muted)]">
              ≈ ${(vaultSui * priceUsd).toFixed(2)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1.5 text-[var(--muted)]">
            Wallet (liquid)
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </p>
          <p className="mt-0.5 font-mono font-semibold tabular-nums">
            {hasAmount ? `${fmt(liquidSui)} SUI` : "—"}
          </p>
          {hasAmount && priceUsd && (
            <p className="text-[10px] text-[var(--muted)]">
              ≈ ${(liquidSui * priceUsd).toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
