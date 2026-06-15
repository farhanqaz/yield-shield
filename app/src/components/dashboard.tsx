"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";
import { AppShell } from "./app-shell";
import { VaultPanel } from "./vault-panel";
import { StatusBadge } from "./status-badge";
import { useVault } from "@/hooks/useVault";
import { CONFIG } from "@/lib/config";

export function Dashboard() {
  const account = useCurrentAccount();
  const { vault } = useVault();
  const score = vault?.score ?? 100;
  const status = (vault?.status ?? 0) as 0 | 1 | 2;
  const vaultPct = CONFIG.smartSaveVaultBps / 100;
  const liquidPct = (10000 - CONFIG.smartSaveVaultBps) / 100;

  return (
    <AppShell badge={<StatusBadge status={status} score={score} />}>
      <section className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--accent)]">
          Programmable money
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          <span className="text-gradient">Savings with</span>{" "}
          <span className="text-gradient-accent">on-chain guardrails</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          Smart Save splits every payment in one atomic PTB —{" "}
          <strong className="font-medium text-[var(--text)]">
            {vaultPct}% guarded vault
          </strong>{" "}
          and{" "}
          <strong className="font-medium text-[var(--text)]">
            {liquidPct}% liquid buffer
          </strong>
          . ShieldScore pauses new deposits when risk spikes. Withdraw anytime.
        </p>
        {!account && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ConnectButton />
            <Link
              href="/save?amount=0.5"
              className="text-sm text-[var(--muted)] underline transition hover:text-[var(--text)]"
            >
              Try programmable payment →
            </Link>
          </div>
        )}
        {account && (
          <p className="mt-4 truncate font-mono text-[10px] text-[var(--muted)]">
            {account.address}
          </p>
        )}
      </section>

      <VaultPanel />
    </AppShell>
  );
}
