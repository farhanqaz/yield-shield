"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "./app-shell";
import { VaultPanel } from "./vault-panel";
import { CONFIG } from "@/lib/config";

function SaveFlowInner() {
  const params = useSearchParams();
  const preset = params.get("amount") ?? "0.5";
  const account = useCurrentAccount();
  const vaultPct = CONFIG.smartSaveVaultBps / 100;
  const liquidPct = (10000 - CONFIG.smartSaveVaultBps) / 100;

  return (
    <AppShell>
      <section className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--accent)]">
          Programmable payment
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-gradient">Incoming payment</span>{" "}
          <span className="text-gradient-accent">→ auto-save</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          One atomic PTB splits funds into a guarded vault and liquid buffer — no
          manual steps after you sign.
        </p>

        <div className="glass-card mt-6 inline-flex items-baseline gap-3 rounded-2xl px-6 py-4">
          <span className="text-sm text-[var(--muted)]">Amount</span>
          <span className="font-mono text-3xl font-bold tabular-nums text-[var(--text)]">
            {preset}
          </span>
          <span className="text-sm font-medium text-[var(--muted)]">SUI</span>
        </div>

        <p className="mt-4 text-xs text-[var(--muted)]">
          Split: {vaultPct}% vault · {liquidPct}% wallet
          {CONFIG.enableNavi && " · NAVI yield (mainnet)"}
        </p>
      </section>

      {!account ? (
        <div className="glass-card flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-sm text-[var(--muted)]">
            Connect wallet to execute programmable save.
          </p>
          <ConnectButton />
        </div>
      ) : (
        <VaultPanel defaultAmount={preset} />
      )}
    </AppShell>
  );
}

export function SaveFlow() {
  return (
    <Suspense
      fallback={
        <div className="app-bg flex min-h-screen items-center justify-center">
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        </div>
      }
    >
      <SaveFlowInner />
    </Suspense>
  );
}
