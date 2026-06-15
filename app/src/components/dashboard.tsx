"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "./app-shell";
import { VaultPanel } from "./vault-panel";
import { StatusBadge } from "./status-badge";
import { useVault } from "@/hooks/useVault";
import { bpsToPercent, vaultBpsFromUrlParam } from "@/lib/split-preference";

function DashboardInner() {
  const params = useSearchParams();
  const paymentAmount = params.get("amount");
  const vaultFromUrl = vaultBpsFromUrlParam(params.get("vault"));
  const account = useCurrentAccount();
  const { vault } = useVault();
  const score = vault?.score ?? 100;
  const status = (vault?.status ?? 0) as 0 | 1 | 2;
  const vaultPct = vaultFromUrl ? bpsToPercent(vaultFromUrl) : null;

  return (
    <AppShell badge={<StatusBadge status={status} score={score} />}>
      <section className="mx-auto mb-8 max-w-xl text-center">
        {paymentAmount ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Save{" "}
              <span className="font-mono text-[var(--safe)]">{paymentAmount}</span>{" "}
              SUI
            </h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Payment link — choose your split, then save in one tap.
              {vaultPct != null && (
                <>
                  {" "}
                  Preset: <strong>{vaultPct}%</strong> vault.
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Save SUI with guardrails
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Set how much goes to vault vs wallet — every save splits automatically
              in one transaction. ShieldScore pauses deposits when risk is high.
              Withdraw anytime.
            </p>
          </>
        )}

        {!account && (
          <div className="mt-6 flex justify-center">
            <ConnectButton />
          </div>
        )}
      </section>

      <VaultPanel
        defaultAmount={paymentAmount ?? "0.1"}
        defaultVaultBps={vaultFromUrl ?? undefined}
        paymentLink={!!paymentAmount}
      />
    </AppShell>
  );
}

export function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="app-bg flex min-h-screen items-center justify-center">
          <div className="skeleton h-8 w-48" />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
