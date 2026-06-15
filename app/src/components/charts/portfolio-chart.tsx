"use client";

type Props = {
  vaultSui: number;
  walletSui: number;
  priceUsd?: number;
};

function fmt(n: number): string {
  if (n === 0) return "0";
  return n.toFixed(4).replace(/\.?0+$/, (m) => (m === "." ? "" : m));
}

export function PortfolioChart({ vaultSui, walletSui, priceUsd }: Props) {
  const total = vaultSui + walletSui;
  const vaultPct = total > 0 ? (vaultSui / total) * 100 : 0;
  const walletPct = total > 0 ? 100 - vaultPct : 0;
  const totalUsd = priceUsd ? total * priceUsd : null;

  if (total <= 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-xs text-[var(--muted)]">
        Save SUI to see your portfolio split
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-black/20 p-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
            Your portfolio
          </p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums">
            {fmt(total)} SUI
          </p>
          {totalUsd != null && (
            <p className="text-xs text-[var(--muted)]">≈ ${totalUsd.toFixed(2)}</p>
          )}
        </div>
        <div className="text-right text-[10px] text-[var(--muted)]">
          <p>
            <span className="text-[var(--safe)]">●</span> Vault {vaultPct.toFixed(0)}%
          </p>
          <p>
            <span className="text-[var(--accent)]">●</span> Wallet {walletPct.toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex h-3 overflow-hidden rounded-full">
        <div
          className="bg-[var(--safe)] transition-all duration-500"
          style={{ width: `${vaultPct}%` }}
        />
        <div
          className="bg-[var(--accent)] transition-all duration-500"
          style={{ width: `${walletPct}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-[var(--safe)]/10 px-3 py-2">
          <p className="text-[var(--muted)]">In vault</p>
          <p className="font-mono font-semibold">{fmt(vaultSui)} SUI</p>
        </div>
        <div className="rounded-lg bg-[var(--accent)]/10 px-3 py-2 text-right">
          <p className="text-[var(--muted)]">In wallet</p>
          <p className="font-mono font-semibold">{fmt(walletSui)} SUI</p>
        </div>
      </div>
    </div>
  );
}
